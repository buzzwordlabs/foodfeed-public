import {
  JoinStreamData,
  LeaveStreamData,
  OfferAnswer,
  SocketJWT,
  StreamerBlockedViewerData,
  StatusCallback,
  StreamReactionData,
  StreamMessageData,
  DeviceOrientation,
  UserRedisData
} from '../types';
import {
  ServerStreamEvents,
  SocketRooms,
  ClientStreamEvents,
  ClientStreamErrorEvents,
  JanusManagerEvents,
  JanusManagerToClientEvents,
  AMPLITUDE_TRANSACTIONAL_EVENTS
} from './constants';
import {
  countAllUsersInRooms,
  getRedisStreamData,
  getRedisUserInfo,
  initStreamData,
  joinRoom,
  leaveRoom,
  setRedisViewerStreamData,
  unsetRedisActivityData
} from './helpers';
import {
  getClientConnection,
  retrieveClientConnectionFromRedis,
  retrieveRedisClientConnectionUrl,
  retrieveRoundRobinConnection
} from './janusmanagerclientsocket';
import { logger, redis, amplitude, pgPool } from '../utils';
import * as db from '../zapatos/src';
import * as s from '../zapatos/schema';

import { isEmpty } from 'lodash';
import { newLiveStreamNotification } from '../utils/pushNotifications';

const janusManagerSocketClientEmit = (
  event: string,
  janusManagerClientSocket: SocketIOClient.Socket,
  ...args: any[]
) => {
  try {
    janusManagerClientSocket.emit(event, ...args);
  } catch (err) {
    logger.error('janusManagerSocketClientEmit()', err);
  }
};

const setStreamerOnline = async ({
  userId,
  streamTitle,
  deviceId,
  janusManagerUrl,
  streamHistoryId
}: {
  userId: s.users.Selectable['id'];
  streamTitle: string;
  deviceId: string;
  janusManagerUrl: string;
  streamHistoryId: s.stream_history.Selectable['id'];
}) => {
  const { username, avatar } = await getRedisUserInfo(userId, [
    'username',
    'avatar'
  ]);
  await initStreamData({
    deviceId: deviceId,
    title: streamTitle,
    username: username!,
    avatar: avatar!,
    isStreaming: true,
    janusSession: janusManagerUrl,
    streamHistory: streamHistoryId
  });
  return db.sql<s.online_users.SQL>`
    UPDATE ${'online_users'}
    SET ${'isStreaming'}=${db.param(true)}, ${'streamTitle'} = ${db.param(
    streamTitle
  )} WHERE ${'deviceId'} = ${db.param(deviceId)}`.run(pgPool);
};

const sendNotificationsToAllFollowersOfStreamer = async (
  deviceId: string,
  userId: string
) => {
  const usernameStr: keyof Pick<UserRedisData, 'username'> = 'username';
  const username = await redis.hget(userId, usernameStr);

  type NotificationTokenQuery = {
    [key in keyof Pick<
      s.users_devices.Selectable,
      'platform'
    >]: s.users_devices_platform_enum;
  } & {
    array_agg: s.users_devices.Selectable['notificationToken'][];
  };

  const notificationTokens = await db.sql<
    s.users_devices.SQL | s.users_followers.SQL,
    NotificationTokenQuery[]
  >`
  SELECT ${'platform'}, ARRAY_AGG(${'users_devices'}.${'notificationToken'})
  FROM ${'users_followers'}
  JOIN ${'users_devices'} ON ${'users_followers'}.${'followerId'} = ${'users_devices'}.${'userId'}
  WHERE ${'users_followers'}.${'userId'}=${db.param(
    userId
  )} AND ${'users_devices'}.${'notificationToken'} IS NOT NULL
  GROUP BY ${'users_devices'}.${'platform'}`.run(pgPool);
  if (isEmpty(notificationTokens)) return;
  const tokens = {
    androidNotificationTokens:
      notificationTokens[0].platform === 'android'
        ? (notificationTokens[0].array_agg as string[])
        : (notificationTokens[1]?.array_agg as string[]),
    appleNotificationTokens:
      notificationTokens[0].platform === 'ios'
        ? (notificationTokens[0].array_agg as string[])
        : (notificationTokens[1]?.array_agg as string[])
  };
  return newLiveStreamNotification({
    customData: { deviceId, username: username! },
    notificationTokens: tokens
  });
};

const janusManagerIceCandidateListener = (
  event: string,
  socket: SocketJWT,
  janusManagerSocket: SocketIOClient.Socket,
  data: { candidate: any },
  statusCb: StatusCallback,
  statusIceCb: (status: string) => void
) => {
  janusManagerSocketClientEmit(
    event,
    janusManagerSocket,
    data,
    (status: string) => {
      if (status === 'error') {
        statusCb('error');
        statusIceCb('ok');
        socket.removeAllListeners(event);
      }
      if (status === 'ok') {
        statusIceCb('ok');
        if (data.candidate.completed) {
          socket.removeAllListeners(event);
        }
      }
    }
  );
};

const startStreamJanus = (
  socket: SocketJWT,
  deviceId: s.online_users.Selectable['deviceId'],
  janusManagerSocket: SocketIOClient.Socket,
  data: {
    streamTitle?: string;
    offer: OfferAnswer;
    record?: boolean;
    restart?: boolean;
  } & {
    streamHistoryId: string;
  },
  statusCb: StatusCallback
) => {
  janusManagerSocketClientEmit(
    JanusManagerEvents.START_STREAM_JANUS,
    janusManagerSocket,
    {
      deviceId: deviceId,
      ...data
    },
    (status: 'error' | 'ok', answer?: OfferAnswer) => {
      switch (status) {
        case 'error': {
          statusCb('error');
          break;
        }
        case 'ok': {
          socket.emit(JanusManagerToClientEvents.STREAM_STARTED, { answer });
          break;
        }
      }
    }
  );
};

const startStream = async (
  io: SocketIO.Server,
  socket: SocketJWT,
  data: {
    streamTitle: string;
    offer: OfferAnswer;
    record?: boolean;
  },
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    const {
      janusManagerSocket,
      janusManagerUrl
    } = await retrieveRoundRobinConnection();
    if (!janusManagerSocket) {
      statusCb('error');
      return logger.error('No microservice connection exists');
    }

    const onlineUser = await db.sql<
      s.online_users.SQL,
      Pick<s.online_users.Selectable, 'thumbnail'>[]
    >`SELECT ${'thumbnail'}
      FROM ${'online_users'}
      WHERE ${'deviceId'} = ${db.param(deviceId)}`.run(pgPool);

    const streamHistoryData: s.stream_history.Insertable = {
      userId: socket.userSession.id,
      title: data.streamTitle,
      thumbnail: onlineUser[0].thumbnail,
      deviceId: deviceId
    };

    const streamHistory = await db.sql<
      s.stream_history.SQL,
      Pick<s.stream_history.Selectable, 'id'>[]
    >`
      INSERT INTO ${'stream_history'} (${db.cols(streamHistoryData)})
      VALUES (${db.vals(streamHistoryData)}) RETURNING ${'id'}`.run(pgPool);

    startStreamJanus(
      socket,
      deviceId,
      janusManagerSocket,
      { ...data, streamHistoryId: streamHistory[0].id },
      statusCb
    );
    socket.on(`${deviceId}_streamer_ice_candidate`, (data, statusIceCb) =>
      janusManagerIceCandidateListener(
        `${deviceId}_streamer_ice_candidate`,
        socket,
        janusManagerSocket,
        data,
        statusCb,
        statusIceCb
      )
    );
    await joinRoom(io, socket.id, SocketRooms.STREAM_ROOM);

    await setStreamerOnline({
      userId: socket.userSession.id,
      streamTitle: data.streamTitle,
      deviceId: deviceId,
      janusManagerUrl: janusManagerUrl,
      streamHistoryId: streamHistory[0].id
    });
    statusCb('ok');

    try {
      await sendNotificationsToAllFollowersOfStreamer(
        deviceId,
        socket.userSession.id
      );
    } catch (err) {
      logger.error('sendNotificationsToAllFollowersOfStreamer()', err);
    }
  } catch (err) {
    logger.error('startStream()', err);
    statusCb('error');
  }
};

const videoStreamCrashedStreamer = async (
  socket: SocketJWT,
  data: { offer: OfferAnswer },
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    const janusManagerSocket = await retrieveClientConnectionFromRedis(
      deviceId
    );
    if (!janusManagerSocket) {
      if (statusCb) statusCb('error');
      return logger.warn(
        'videoStreamCrashedStreamer() JANUS MANAGER SOCKET NOT FOUND'
      );
    }
    const streamHistoryId = await redis.hget(deviceId, 'streamHistory');
    if (streamHistoryId)
      startStreamJanus(
        socket,
        deviceId,
        janusManagerSocket,
        { ...data, streamHistoryId },
        statusCb
      );
    socket.on(`${deviceId}_streamer_ice_candidate`, (data, statusIceCb) =>
      janusManagerIceCandidateListener(
        `${deviceId}_streamer_ice_candidate`,
        socket,
        janusManagerSocket,
        data,
        statusCb,
        statusIceCb
      )
    );
    statusCb('ok');
  } catch (err) {
    logger.error('videoStreamCrashedStreamer()', err);
    statusCb('error');
  }
};

const videoStreamRestartedStreamer = async (
  socket: SocketJWT,
  data: { offer: OfferAnswer },
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    const janusManagerSocket = await retrieveClientConnectionFromRedis(
      deviceId
    );
    if (!janusManagerSocket) {
      if (statusCb) statusCb('error');
      return logger.warn(
        'videoStreamRestartedStreamer() JANUS MANAGER SOCKET NOT FOUND'
      );
    }
    const streamHistoryId = await redis.hget(deviceId, 'streamHistory');
    if (streamHistoryId)
      startStreamJanus(
        socket,
        deviceId,
        janusManagerSocket,
        { offer: data.offer, restart: true, streamHistoryId },
        statusCb
      );
    socket.on(`${deviceId}_streamer_ice_candidate`, (data, statusIceCb) =>
      janusManagerIceCandidateListener(
        `${deviceId}_streamer_ice_candidate`,
        socket,
        janusManagerSocket,
        data,
        statusCb,
        statusIceCb
      )
    );
    socket.to(deviceId).emit(ClientStreamEvents.VIDEO_STREAM_RESTART_VIEWER);
    statusCb('ok');
  } catch (err) {
    logger.error('videoStreamRestartedStreamer()', err);
    statusCb('error');
  }
};

export const streamEnded = async (
  io: SocketIO.Server,
  socket: SocketJWT,
  deviceId: string,
  disconnected: boolean,
  statusCb?: StatusCallback
) => {
  try {
    const janusManagerSocket = await retrieveClientConnectionFromRedis(
      deviceId
    );
    if (janusManagerSocket) {
      janusManagerSocketClientEmit(
        JanusManagerEvents.STREAM_ENDED_JANUS,
        janusManagerSocket,
        {
          deviceId: deviceId,
          disconnected
        },
        (_status: string) => {}
      );
    } else {
      logger.warn('streamEnded() JANUS MANAGER SOCKET NOT FOUND');
    }
    socket.to(deviceId).emit(ClientStreamEvents.STREAM_COMPLETE);
    if (!disconnected) {
      await leaveRoom(io, socket.id, SocketRooms.STREAM_ROOM);
      await unsetRedisActivityData(deviceId);
      await db.sql<s.online_users.SQL>`
        UPDATE ${'online_users'}
        SET ${'isStreaming'}=${db.param(false)}, ${'streamTitle'} = ${db.param(
        null
      )} WHERE ${'deviceId'} = ${db.param(deviceId)}`.run(pgPool);
    }
    const streamHistory = await redis.hget(deviceId, 'streamHistory');
    await db.sql<
      s.stream_history.SQL
    >`UPDATE ${'stream_history'} SET ${'completedAt'} = ${db.param(
      new Date()
    )} WHERE ${'id'} = ${db.param(streamHistory)}`.run(pgPool);
    if (!disconnected && statusCb) statusCb('ok');

    try {
      await amplitude.track({
        event_type: AMPLITUDE_TRANSACTIONAL_EVENTS.COMPLETED_LIVE_STREAM,
        user_id: socket.userSession.id,
        device_id: deviceId,
        event_properties: { streamId: streamHistory }
      });
    } catch (err) {
      logger.error('amplitude streamEnded()', err);
    }
  } catch (err) {
    logger.error('streamEnded()', err);
    if (!disconnected && statusCb) statusCb('ok');
  }
};

const joinStreamJanus = (
  socket: SocketJWT,
  deviceId: s.online_users.Selectable['deviceId'],
  janusManagerSocket: SocketIOClient.Socket,
  data: Partial<JoinStreamData>,
  statusCb: StatusCallback
) => {
  janusManagerSocketClientEmit(
    JanusManagerEvents.JOINED_STREAM_JANUS,
    janusManagerSocket,
    {
      streamerDeviceId: data.remoteDeviceId,
      deviceId: deviceId
    },
    (status: 'error' | 'ok', offer?: OfferAnswer) => {
      switch (status) {
        case 'error': {
          statusCb('error');
          break;
        }
        case 'ok': {
          socket.emit(JanusManagerToClientEvents.STREAM_VIEWER_OFFER, {
            offer: offer,
            remoteDeviceId: data.remoteDeviceId
          });
          break;
        }
      }
    }
  );
};

const joinStream = async (
  io: SocketIO.Server,
  socket: SocketJWT,
  data: JoinStreamData,
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    const streamerUserId = await redis.hget(data.remoteDeviceId, 'userId');
    const isBlocked = await db.sql<
      s.users_blocklist.SQL,
      [{ exists: boolean }]
    >`
      SELECT EXISTS
      (
        SELECT 1 FROM ${'users_blocklist'}
        WHERE
        (${'userId'} = ${db.param(
      socket.userSession.id
    )} AND "blockedId" = ${db.param(streamerUserId)}
        )
        OR
        (${'userId'} = ${db.param(streamerUserId)} AND "blockedId" = ${db.param(
      socket.userSession.id
    )})
    )`.run(pgPool);
    if (isBlocked[0].exists) {
      statusCb('ok');
      return socket.emit(ClientStreamEvents.STREAM_ERROR, {
        type: ClientStreamErrorEvents.STREAM_NOT_AVAILABLE
      });
    }
    const janusManagerUrl = await retrieveRedisClientConnectionUrl(
      data.remoteDeviceId
    );
    if (!janusManagerUrl) {
      logger.warn('joinStream() JANUS MANAGER SOCKET NOT FOUND');
      statusCb('ok');
      return socket.emit(ClientStreamEvents.STREAM_ERROR, {
        type: ClientStreamErrorEvents.STREAM_NOT_AVAILABLE
      });
    }
    const janusManagerSocket = getClientConnection(janusManagerUrl);
    joinStreamJanus(socket, deviceId, janusManagerSocket, data, statusCb);

    socket.on(`${deviceId}_viewer_ice_candidate`, (data, statusIceCb) =>
      janusManagerIceCandidateListener(
        `${deviceId}_viewer_ice_candidate`,
        socket,
        janusManagerSocket,
        data,
        statusCb,
        statusIceCb
      )
    );

    await joinRoom(io, socket.id, data.remoteDeviceId);
    await setRedisViewerStreamData(deviceId, {
      isViewing: true,
      activeConnection: data.remoteDeviceId,
      janusSession: janusManagerUrl
    });
    await db.sql<s.online_users.SQL>`
    UPDATE ${'online_users'}
    SET ${'activeConnection'}=${db.param(
      data.remoteDeviceId
    )}, ${'isViewing'} = ${db.param(true)}
    WHERE ${'deviceId'} = ${db.param(deviceId)}`.run(pgPool);

    const streamData = await getRedisStreamData(data.remoteDeviceId, [
      'username',
      'avatar',
      'upvote',
      'downvote',
      'title',
      'videoPaused',
      'streamHistory',
      'deviceOrientation'
    ]);
    const streamHistory = streamData?.streamHistory;
    const blockedUsernamesArray = await db.sql<
      s.users.SQL | s.users_blocklist.SQL,
      Pick<s.users.Selectable, 'username'>[]
    >`SELECT ${'username'} FROM ${'users'}
    JOIN ${'users_blocklist'}
    ON ${'users'}.${'id'}=${'users_blocklist'}.${'userId'}
    WHERE ${'users_blocklist'}.${'userId'} = ${db.param(
      socket.userSession.id
    )}`.run(pgPool);
    const blockedUsernames: { [index: string]: boolean } = {};
    blockedUsernamesArray.map((blockedUser) => {
      blockedUsernames[blockedUser.username] = true;
    });
    const countUsersInRoom = await countAllUsersInRooms(io, [
      data.remoteDeviceId
    ]);
    const viewerFollowsStreamer = await db.sql<
      s.users_followers.SQL,
      Pick<s.users_followers.Selectable, 'userId'>[]
    >`SELECT ${'userId'} FROM ${'users_followers'} WHERE ${'userId'}=${db.param(
      streamerUserId
    )} AND ${'followerId'}=${db.param(socket.userSession.id)}`.run(pgPool);

    const reaction = await db.sql<
      s.users_streams_reactions.SQL,
      Pick<s.users_streams_reactions.Selectable, 'reaction'>[]
    >`SELECT ${'reaction'} FROM ${'users_streams_reactions'} WHERE ${'userId'}=${db.param(
      socket.userSession.id
    )} AND ${'streamId'}=${db.param(streamHistory)}`.run(pgPool);
    if (streamHistory) {
      await db.sql<
        s.users_live_streams_viewers.SQL
      >`INSERT INTO ${'users_live_streams_viewers'}(${'userId'}, ${'streamId'}) VALUES (${db.param(
        socket.userSession.id
      )},${db.param(streamHistory)})`.run(pgPool);
    }
    statusCb('ok', {
      streamData: {
        username: streamData?.username,
        avatar: streamData?.avatar,
        upvote: streamData?.upvote,
        downvote: streamData?.downvote,
        title: streamData?.title,
        isFollowing: viewerFollowsStreamer.length > 0,
        remoteDeviceId: data.remoteDeviceId,
        videoPaused: streamData?.videoPaused,
        deviceOrientation: streamData?.deviceOrientation
      },
      blockedUsers: blockedUsernames,
      numViewers: countUsersInRoom - 1,
      currentReaction: reaction[0]?.reaction
    });
    socket.to(data.remoteDeviceId).emit(ClientStreamEvents.STREAM_NEW_VIEWER, {
      numViewers: countUsersInRoom - 1
    });
    try {
      await amplitude.track({
        event_type: AMPLITUDE_TRANSACTIONAL_EVENTS.VIEW_LIVE_STREAM,
        user_id: socket.userSession.id,
        device_id: deviceId,
        event_properties: { streamId: streamHistory }
      });
    } catch (err) {
      logger.error('amplitude joinStream()', err);
    }
  } catch (err) {
    logger.error('joinStream()', err);
    statusCb('error');
  }
};

const videoStreamRestartedViewer = async (
  socket: SocketJWT,
  data: Partial<JoinStreamData>,
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    const janusManagerSocket = await retrieveClientConnectionFromRedis(
      deviceId
    );
    if (!janusManagerSocket) {
      if (statusCb) statusCb('error');
      return logger.warn(
        'videoStreamRestartedViewer() JANUS MANAGER SOCKET NOT FOUND'
      );
    }
    joinStreamJanus(socket, deviceId, janusManagerSocket, data, statusCb);
    socket.on(`${deviceId}_viewer_ice_candidate`, (data, statusIceCb) =>
      janusManagerIceCandidateListener(
        `${deviceId}_viewer_ice_candidate`,
        socket,
        janusManagerSocket,
        data,
        statusCb,
        statusIceCb
      )
    );
    statusCb('ok');
  } catch (err) {
    logger.error('videoStreamRestartedViewer()', err);
    statusCb('error');
  }
};

const videoStreamCrashedViewer = async (
  socket: SocketJWT,
  data: Partial<JoinStreamData>,
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    const janusManagerSocket = await retrieveClientConnectionFromRedis(
      deviceId
    );
    if (!janusManagerSocket) {
      if (statusCb) statusCb('error');
      return logger.warn(
        'videoStreamCrashedViewer() JANUS MANAGER SOCKET NOT FOUND'
      );
    }
    joinStreamJanus(socket, deviceId, janusManagerSocket, data, statusCb);
    socket.on(`${deviceId}_viewer_ice_candidate`, (data, statusIceCb) =>
      janusManagerIceCandidateListener(
        `${deviceId}_viewer_ice_candidate`,
        socket,
        janusManagerSocket,
        data,
        statusCb,
        statusIceCb
      )
    );
    statusCb('ok');
  } catch (err) {
    logger.error('videoStreamCrashedViewer()', err);
    statusCb('error');
  }
};

const viewerAnsweredStream = async (
  data: { answer: OfferAnswer },
  deviceId: string,
  statusCb: StatusCallback
) => {
  const janusManagerSocket = await retrieveClientConnectionFromRedis(deviceId);
  if (!janusManagerSocket) {
    logger.warn('viewerAnsweredStream() JANUS MANAGER SOCKET NOT FOUND');
    return statusCb('error');
  }
  janusManagerSocketClientEmit(
    JanusManagerEvents.VIEWER_ANSWERED_STREAMER_JANUS,
    janusManagerSocket,
    {
      answer: data.answer,
      deviceId: deviceId
    },
    (status: string) => {
      if (status === 'error') {
        statusCb('error');
      } else {
        statusCb('ok');
      }
    }
  );
};

export const leaveStream = async (
  io: SocketIO.Server,
  socket: SocketJWT,
  // this can be the socket id of the streamer or person to be blocked
  socketId: SocketIO.Socket['id'],
  data: LeaveStreamData,
  deviceId: string,
  disconnected: boolean,
  blocked: boolean,
  statusCb: StatusCallback
) => {
  try {
    const janusManagerSocket = await retrieveClientConnectionFromRedis(
      deviceId
    );
    if (!disconnected) {
      await leaveRoom(io, socketId, data.remoteDeviceId);
      await db.sql<s.online_users.SQL>`
        UPDATE ${'online_users'}
        SET ${'activeConnection'}=${db.param(
        null
      )}, ${'isViewing'} = ${db.param(false)}
        WHERE ${'deviceId'} = ${db.param(deviceId)}`.run(pgPool);
      await unsetRedisActivityData(deviceId);
    }
    if (janusManagerSocket) {
      janusManagerSocketClientEmit(
        JanusManagerEvents.VIEWER_LEFT_STREAM_JANUS,
        janusManagerSocket,
        {
          deviceId: deviceId,
          disconnected,
          streamEnded: data.streamEnded
        },
        (_status: 'ok' | 'error') => {}
      );
      const countUsersInRoom = await countAllUsersInRooms(io, [
        data.remoteDeviceId
      ]);
      socket
        .to(data.remoteDeviceId)
        .emit(ClientStreamEvents.STREAM_VIEWER_DISCONNECTED, {
          numViewers: countUsersInRoom - 1
        });
      if (blocked) {
        // the socket passed in within this case is the streamer's, not the person that left
        socket.to(socketId).emit(ClientStreamEvents.STREAM_ERROR, {
          type: ClientStreamErrorEvents.STREAMER_BLOCK_VIEWER
        });
        socket.emit(ClientStreamEvents.STREAM_VIEWER_DISCONNECTED, {
          numViewers: countUsersInRoom - 1
        });
      }
    } else {
      logger.warn('leaveStream() JANUS MANAGER SOCKET NOT FOUND');
    }

    statusCb('ok');
  } catch (err) {
    logger.error('leaveStream()', err);
    statusCb('error');
  }
};

// TODO if number is ever less than 0, just make it zero
const streamReaction = async (
  socket: SocketJWT,
  data: StreamReactionData,
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    const streamHistoryId = await redis.hget(
      data.remoteDeviceId,
      'streamHistory'
    );

    const reactions = await db.sql<
      s.users_streams_reactions.SQL,
      Pick<s.users_streams_reactions.Selectable, 'reaction'>[]
    >`SELECT ${'reaction'} FROM ${'users_streams_reactions'} WHERE ${'userId'}=${db.param(
      socket.userSession.id
    )} AND ${'streamId'}=${db.param(streamHistoryId)}`.run(pgPool);

    const multipleDevices = await db.sql<
      s.online_users.SQL,
      Pick<s.online_users.Selectable, 'deviceId'>[]
    >`SELECT ${'deviceId'} FROM ${'online_users'} WHERE ${'userId'}=${db.param(
      socket.userSession.id
    )} AND ${'activeConnection'}=${db.param(
      data.remoteDeviceId
    )} AND ${'deviceId'} <> ${db.param(deviceId)}`.run(pgPool);

    if (multipleDevices.length > 0) {
      multipleDevices.map((device) => {
        socket
          .to(device.deviceId)
          .emit(ClientStreamEvents.STREAM_REACTION_ON_OTHER_DEVICE, {
            type: data.type,
            set: data.set
          });
      });
    }

    if (reactions.length > 0) {
      await redis.hincrby(data.remoteDeviceId, reactions[0].reaction, -1);
      if (data.set) {
        await db.sql<
          s.users_streams_reactions.SQL
        >`UPDATE ${'users_streams_reactions'} SET ${'reaction'} = ${db.param(
          data.type
        )} WHERE ${'userId'}=${db.param(
          socket.userSession.id
        )} AND ${'streamId'}=${db.param(streamHistoryId)}`.run(pgPool);
      } else {
        await db.sql<
          s.users_streams_reactions.SQL
        >`DELETE FROM ${'users_streams_reactions'}
         WHERE ${'userId'}=${db.param(
          socket.userSession.id
        )} AND ${'streamId'}=${db.param(streamHistoryId)}`.run(pgPool);
      }
    } else {
      await db.sql<
        s.users_streams_reactions.SQL
      >`INSERT INTO ${'users_streams_reactions'}(${'userId'}, ${'streamId'}, ${'reaction'}) VALUES (${db.param(
        socket.userSession.id
      )},${db.param(streamHistoryId)}, ${db.param(data.type)})`.run(pgPool);
    }
    if (data.set) {
      await redis.hincrby(data.remoteDeviceId, data.type, 1);
    }
    if (reactions.length > 0 && data.type !== reactions[0].reaction) {
      const oldReactionVal = Number(
        await redis.hget(data.remoteDeviceId, reactions[0].reaction)
      );
      socket
        .to(data.remoteDeviceId)
        .emit(ClientStreamEvents.STREAM_REACTION_RECEIVED, {
          type: reactions[0].reaction,
          set: data.set,
          value: oldReactionVal
        });
      socket.emit(ClientStreamEvents.STREAM_REACTION_RECEIVED, {
        type: reactions[0].reaction,
        set: data.set,
        value: oldReactionVal
      });
    }
    const value = Number(await redis.hget(data.remoteDeviceId, data.type));
    socket
      .to(data.remoteDeviceId)
      .emit(ClientStreamEvents.STREAM_REACTION_RECEIVED, {
        type: data.type,
        set: data.set,
        value: value
      });
    socket.emit(ClientStreamEvents.STREAM_REACTION_RECEIVED, {
      type: data.type,
      set: data.set,
      value: value
    });
    statusCb('ok');
    try {
      await amplitude.track({
        event_type:
          AMPLITUDE_TRANSACTIONAL_EVENTS.SUBMIT_LIVE_STREAM_REACTION_AS_VIEWER,
        user_id: socket.userSession.id,
        device_id: deviceId,
        event_properties: { streamId: streamHistoryId }
      });
    } catch (err) {
      logger.error('streamReaction()', err);
    }
  } catch (err) {
    logger.error('streamReaction()', err);
    statusCb('error');
  }
};

const streamMessage = async (
  socket: SocketJWT,
  data: StreamMessageData,
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    const isStreamer = !data.remoteDeviceId ? true : false;
    if (!data.remoteDeviceId) {
      data.remoteDeviceId = deviceId;
    }
    socket
      .to(data.remoteDeviceId)
      .emit(ClientStreamEvents.STREAM_MESSAGE_RECEIVED, {
        message: data.message,
        username: data.username,
        avatar: data.avatar,
        deviceId: deviceId
      });
    socket.emit(ClientStreamEvents.STREAM_MESSAGE_RECEIVED, {
      message: data.message,
      username: data.username,
      avatar: data.avatar,
      deviceId: deviceId
    });
    statusCb('ok');
    try {
      const streamHistoryId = await redis.hget(
        data.remoteDeviceId,
        'streamHistory'
      );
      await amplitude.track({
        event_type: isStreamer
          ? AMPLITUDE_TRANSACTIONAL_EVENTS.SUBMIT_LIVE_STREAM_COMMENT_AS_STREAMER
          : AMPLITUDE_TRANSACTIONAL_EVENTS.SUBMIT_LIVE_STREAM_COMMENT_AS_VIEWER,
        user_id: socket.userSession.id,
        device_id: deviceId,
        event_properties: { streamId: streamHistoryId }
      });
    } catch (err) {
      logger.error('amplitude streamMessage()', err);
    }
  } catch (err) {
    logger.error('streamMessage()', err);
    statusCb('error');
  }
};

const streamerBlockViewer = async (
  io: SocketIO.Server,
  socket: SocketJWT,
  data: StreamerBlockedViewerData,
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    const getBlockedUserInfo = await db.sql<
      s.online_users.SQL | s.users.SQL,
      Pick<s.online_users.Selectable, 'socketId' | 'deviceId'>[]
    >`SELECT ${'online_users'}.${'socketId'}, ${'online_users'}.${'deviceId'}
    FROM ${'online_users'}
    JOIN ${'users'} ON ${'online_users'}.${'userId'}=${'users'}.${'id'}
    WHERE ${'users'}.${'username'} = ${db.param(
      data.username
    )} AND ${'online_users'}.${'activeConnection'} = ${db.param(deviceId)}`.run(
      pgPool
    );

    if (getBlockedUserInfo.length === 0) {
      logger.warn('streamerBlockViewer() VIEWER NOT FOUND');
      return statusCb('ok');
    }
    await Promise.all(
      getBlockedUserInfo.map(async (rows) =>
        leaveStream(
          io,
          socket,
          rows.socketId,
          { remoteDeviceId: deviceId },
          rows.deviceId,
          false,
          true,
          statusCb
        )
      )
    );
    statusCb('ok');
  } catch (err) {
    logger.error('streamerBlockedViewer()', err);
    statusCb('error');
  }
};

const streamAppPaused = async (
  socket: SocketJWT,
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    await redis.hset(deviceId, 'videoPaused', 'true');
    socket.to(deviceId).emit(ClientStreamEvents.STREAM_USER_PAUSED);
    statusCb('ok');
  } catch (err) {
    logger.error('streamAppPaused()', err);
    statusCb('error');
  }
};

const streamAppUnpaused = async (
  socket: SocketJWT,
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    await redis.hset(deviceId, 'videoPaused', 'false');
    socket.to(deviceId).emit(ClientStreamEvents.STREAM_USER_UNPAUSED);
    statusCb('ok');
  } catch (err) {
    logger.error('streamAppUnpaused()', err);
    statusCb('error');
  }
};

const deviceOrientationChanged = async (
  socket: SocketJWT,
  data: { orientation: DeviceOrientation },
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    await redis.hset(deviceId, 'deviceOrientation', data.orientation);
    socket
      .to(deviceId)
      .emit(ClientStreamEvents.STREAMER_DEVICE_ORIENTATION_CHANGED, data);
    statusCb('ok');
  } catch (err) {
    logger.error('streamAppUnpaused()', err);
    statusCb('error');
  }
};

export const initStreams = (
  io: SocketIO.Server,
  socket: SocketJWT,
  deviceId: string
) => {
  socket.on(ServerStreamEvents.START_STREAM, (data, statusCb) =>
    startStream(io, socket, data, deviceId, statusCb)
  );

  socket.on(ServerStreamEvents.STREAM_ENDED, (statusCb) =>
    streamEnded(io, socket, deviceId, false, statusCb)
  );

  socket.on(ServerStreamEvents.JOIN_STREAM, (data, statusCb) =>
    joinStream(io, socket, data, deviceId, statusCb)
  );

  socket.on(ServerStreamEvents.VIEWER_ANSWERED_STREAM, (data, statusCb) =>
    viewerAnsweredStream(data, deviceId, statusCb)
  );

  socket.on(ServerStreamEvents.LEAVE_STREAM, (data, statusCb) =>
    leaveStream(io, socket, socket.id, data, deviceId, false, false, statusCb)
  );

  socket.on(ServerStreamEvents.STREAM_REACTION, (data, statusCb) =>
    streamReaction(socket, data, deviceId, statusCb)
  );

  socket.on(ServerStreamEvents.STREAM_MESSAGE, (data, statusCb) =>
    streamMessage(socket, data, deviceId, statusCb)
  );

  socket.on(ClientStreamErrorEvents.STREAMER_BLOCK_VIEWER, (data, statusCb) =>
    streamerBlockViewer(io, socket, data, deviceId, statusCb)
  );

  socket.on(
    ServerStreamEvents.VIDEO_STREAM_CRASHED_STREAMER,
    (data, statusCb) =>
      videoStreamCrashedStreamer(socket, data, deviceId, statusCb)
  );

  socket.on(ServerStreamEvents.VIDEO_STREAM_CRASHED_VIEWER, (data, statusCb) =>
    videoStreamCrashedViewer(socket, data, deviceId, statusCb)
  );

  socket.on(
    ServerStreamEvents.VIDEO_STREAM_RESTARTED_STREAMER,
    (data, statusCb) =>
      videoStreamRestartedStreamer(socket, data, deviceId, statusCb)
  );

  socket.on(
    ServerStreamEvents.VIDEO_STREAM_RESTARTED_VIEWER,
    (data, statusCb) =>
      videoStreamRestartedViewer(socket, data, deviceId, statusCb)
  );

  socket.on(ServerStreamEvents.STREAM_APP_PAUSED, (statusCb) =>
    streamAppPaused(socket, deviceId, statusCb)
  );

  socket.on(ServerStreamEvents.STREAM_APP_UNPAUSED, (statusCb) =>
    streamAppUnpaused(socket, deviceId, statusCb)
  );

  socket.on(
    ServerStreamEvents.STREAM_DEVICE_ORIENTATION_CHANGED,
    (data, statusCb) =>
      deviceOrientationChanged(socket, data, deviceId, statusCb)
  );
};
