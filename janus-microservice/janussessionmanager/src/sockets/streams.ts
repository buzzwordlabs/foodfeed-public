import { JanusPluginHandle, JanusSession } from 'minijanus-ts';
import { OfferAnswer } from './types';

import { INSTANCE_URL } from '../config';
import { logger, redis, pgPool } from '../utils';
import {
  ws,
  sessions,
  StreamerSession,
  ViewerSession,
  janusSessionLogger
} from './sessions';
import { JanusManagerServerEvents } from './constants';
import * as db from '../zapatos/src';

const startStreamJanus = async (
  socket: SocketIO.Socket,
  data: {
    offer: OfferAnswer;
    deviceId: string;
    restart?: boolean;
    streamHistoryId: string;
    record?: boolean;
  },
  cb: (status: 'ok' | 'error', data?: any) => void
) => {
  try {
    if (data.restart) {
      await streamEndedJanus(
        { deviceId: data.deviceId, disconnected: false },
        () => {}
      );
    }
    delete sessions[data.deviceId];
    const session = new JanusSession(
      ws.send.bind(ws),
      {
        multiSession: true,
        keepAliveRetries: 1
      },
      janusSessionLogger
    );
    const handle = new JanusPluginHandle(session);

    const janusMessageEventListenerFunc = (ev: { data: string }) => {
      session.receive(JSON.parse(ev.data));
    };
    ws.addEventListener('message', janusMessageEventListenerFunc);

    await session.create();
    await handle.attach('janus.plugin.videoroom');
    await handle.createRoom();
    const response: any = await handle.joinPublisher();
    handle.feedId = response.plugindata.data.id;
    const iceCandidateListener = async (
      ev: any,
      statusCb: (status: string) => void
    ) => {
      try {
        if (ev) {
          await handle.sendTrickle(ev.candidate);
          statusCb('ok');
          if (ev.candidate.completed) {
            socket.removeAllListeners(
              `${data.deviceId}_streamer_ice_candidate`
            );
          }
        } else {
          socket.removeAllListeners(`${data.deviceId}_streamer_ice_candidate`);
          statusCb('error');
        }
      } catch (err) {
        logger.error('startStreamJanus() ice candidate listener', err);
        statusCb('error');
      }
    };
    socket.on(`${data.deviceId}_streamer_ice_candidate`, (ev, statusCb) =>
      iceCandidateListener(ev, statusCb)
    );
    const remoteDescription: any = await handle.sendJsep(data.offer, {
      request: 'publish',
      record: data.record ?? false,
      filename: `/janus/recordings/${data.streamHistoryId}`
    });

    sessions[data.deviceId] = {
      session: session,
      handle: handle,
      janusMessageEventListenerFunc
    };
    await redis.hset(data.deviceId, 'janusSession', INSTANCE_URL!);
    await db
      .upsert(
        'sessions',
        {
          deviceId: data.deviceId,
          isStreaming: true
        },
        'deviceId'
      )
      .run(pgPool);

    cb('ok', remoteDescription.jsep);
  } catch (err) {
    try {
      cb('error');
      delete sessions[data.deviceId];
      await redis.hdel(data.deviceId, 'janusSession');
      await db.deletes('sessions', { deviceId: data.deviceId }).run(pgPool);
      logger.error('startStreamJanus()', err);
    } catch (err) {
      logger.error('startStreamJanus() second layer', err);
    }
  }
};

const streamEndedJanus = async (
  data: { deviceId: string; disconnected: boolean },
  cb: (status: 'ok' | 'error') => any
) => {
  try {
    const sessionStore = sessions[data.deviceId] as StreamerSession;
    if (sessions[data.deviceId]) {
      await sessionStore.handle.hangup();
      await sessionStore.handle.detach();
      await sessionStore.session.destroy();
      ws.removeEventListener(
        'message',
        sessionStore.janusMessageEventListenerFunc
      );
      delete sessions[data.deviceId];
      await db.deletes('sessions', { deviceId: data.deviceId }).run(pgPool);
    }
    return cb('ok');
  } catch (err) {
    try {
      delete sessions[data.deviceId];
      await db.deletes('sessions', { deviceId: data.deviceId }).run(pgPool);
      logger.error('streamEndedJanus()', err);
    } catch (err) {
      logger.error('streamEndedJanus() second layer', err);
      cb('error');
    }
  }
};

const joinedStreamJanus = async (
  socket: SocketIO.Socket,
  data: { streamerDeviceId: string; deviceId: string },
  cb: (status: 'ok' | 'error', data?: any) => void
) => {
  try {
    const remoteSession = sessions[data.streamerDeviceId] as StreamerSession;
    if (!remoteSession) {
      logger.warn('No session found here, ignoring request.');
      return cb('ok');
    }
    const handle = new JanusPluginHandle(remoteSession.session);
    await handle.attach('janus.plugin.videoroom');
    const iceCandidateListener = async (
      ev: any,
      statusCb: (status: string) => void
    ) => {
      try {
        if (ev) {
          await handle.sendTrickle(ev.candidate);
          if (ev.candidate.completed) {
            socket.removeAllListeners(`${data.deviceId}_viewer_ice_candidate`);
          }
          statusCb('ok');
        } else {
          socket.removeAllListeners(`${data.deviceId}_viewer_ice_candidate`);
          statusCb('error');
        }
      } catch (err) {
        logger.error('joinedStreamJanus() ice candidate listener', err);
        statusCb('error');
      }
    };
    socket.on(`${data.deviceId}_viewer_ice_candidate`, (ev, statusCb) =>
      iceCandidateListener(ev, statusCb)
    );
    handle.roomId = remoteSession.handle.roomId;
    handle.feedId = remoteSession.handle.feedId;
    const response: any = await handle.sendMessage({
      request: 'join',
      ptype: 'subscriber',
      room: remoteSession.handle.roomId,
      feed: remoteSession.handle.feedId
    });

    sessions[data.deviceId] = {
      handle,
      streamerDeviceId: data.streamerDeviceId
    };
    await db
      .upsert(
        'sessions',
        {
          deviceId: data.deviceId,
          isStreaming: false
        },
        'deviceId'
      )
      .run(pgPool);
    cb('ok', response.jsep);
  } catch (err) {
    try {
      cb('error');
      delete sessions[data.deviceId];
      await db.deletes('sessions', { deviceId: data.deviceId }).run(pgPool);
      logger.error('joinedStreamJanus()', err);
    } catch (err) {
      logger.error('joinedStreamJanus() second layer', err);
    }
  }
};

const viewerAnsweredStreamJanus = async (
  data: {
    deviceId: string;
    answer: OfferAnswer;
  },
  statusCb: (arg0: string) => void
) => {
  try {
    const remoteSession = sessions[data.deviceId];
    if (remoteSession) {
      await remoteSession.handle.sendJsep(data.answer, {
        request: 'start'
      });
    }
    statusCb('ok');
  } catch (err) {
    statusCb('error');
    logger.error('viewerAnsweredStreamJanus()', err);
  }
};

const leftStreamJanus = async (
  data: { deviceId: string; disconnected: boolean; streamEnded: boolean },
  statusCb: (arg0: string) => void
) => {
  try {
    const sessionStore = sessions[data.deviceId] as ViewerSession;
    if (sessions[data.deviceId]) {
      if (!data.disconnected) {
        if (!data.streamEnded) {
          await sessionStore.handle.hangup();
          await sessionStore.handle.detach();
        }
      }
      delete sessions[data.deviceId];
      await db.deletes('sessions', { deviceId: data.deviceId }).run(pgPool);
    }
    return statusCb('ok');
  } catch (err) {
    try {
      statusCb('error');
      delete sessions[data.deviceId];
      await db.deletes('sessions', { deviceId: data.deviceId }).run(pgPool);
      logger.error('leftStreamJanus()', err);
    } catch (err) {
      logger.error('leftStreamJanus() second layer', err);
    }
  }
};

export const initStreamsJanusEvents = (socket: SocketIO.Socket) => {
  socket.on(JanusManagerServerEvents.START_STREAM_JANUS, (data, cb) =>
    startStreamJanus(socket, data, cb)
  );

  socket.on(JanusManagerServerEvents.STREAM_ENDED_JANUS, (data, cb) =>
    streamEndedJanus(data, cb)
  );

  socket.on(JanusManagerServerEvents.JOINED_STREAM_JANUS, (data, cb) =>
    joinedStreamJanus(socket, data, cb)
  );

  socket.on(
    JanusManagerServerEvents.VIEWER_ANSWERED_STREAMER_JANUS,
    (data, statusCb) => viewerAnsweredStreamJanus(data, statusCb)
  );

  socket.on(
    JanusManagerServerEvents.VIEWER_LEFT_STREAM_JANUS,
    (data, statusCb) => leftStreamJanus(data, statusCb)
  );
};
