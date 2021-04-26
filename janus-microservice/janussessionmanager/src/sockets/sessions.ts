import WebSocket from 'ws';
import { logger, sendEmail, pgPool } from '../utils';
import { JANUS_URL, INSTANCE_URL, FOODFEED_CRASHES_EMAIL } from '../config';
import { JanusPluginHandle, JanusSession } from 'minijanus-ts';
import { emitErrorFailedSessions } from '.';
import { io } from '../server';
import * as db from '../zapatos/src';

// index is a deviceId
export const sessions: {
  [index: string]: ViewerSession | StreamerSession;
} = {};

export const sessionToDeviceId: { [index: string]: string } = {};

export type ViewerSession = {
  handle: JanusPluginHandle;
  streamerDeviceId: string;
};

export type StreamerSession = {
  handle: JanusPluginHandle;
  session: JanusSession;
  janusMessageEventListenerFunc: (ev: any) => void;
};

let reconnectionAttempts = 0;
const reconnectInterval = 1000 * 5;
export let ws: WebSocket;
export const connect = () => {
  ws = new WebSocket(JANUS_URL!, 'janus-protocol');
  ws.on('open', () => {
    reconnectionAttempts = 0;
    logger.info('socket to janus has been opened');
  });
  ws.on('error', (err) => {
    logger.error('ws.on("error")', err);
  });
  ws.on('close', () => {
    logger.info('socket to janus closed, will reconnect in 5 seconds...');
    setTimeout(connect, reconnectInterval);
    if (reconnectionAttempts === 0) {
      logger.error(
        `JANUS INSTANCE AT MICROSERVICE CRASHED AT ${INSTANCE_URL}, NEEDS IMMEDIATE ATTENTION`
      );
      emitErrorFailedSessions(io).catch((err) =>
        logger.error('emitErrorFailedSessions() from ws.on("close")', err)
      );
    }
    if (reconnectionAttempts === 10) {
      logger.warn(
        `Trying to reconnect to Janus over 10 times, Janus instance at ${INSTANCE_URL} appears down.`
      );
      sendEmail({
        from: FOODFEED_CRASHES_EMAIL,
        to: FOODFEED_CRASHES_EMAIL,
        subject: 'JANUS INSTANCE DOWN',
        html: `A janus instance is down at ${INSTANCE_URL}. I've attempted to reconnect over 25 times.`
      }).catch((err) => logger.error("ws.on('close') sendEmail()", err));
    }
    reconnectionAttempts += 1;
  });
};

export const janusSessionLogger = ({
  type,
  data
}: {
  type: string;
  data: any;
}) => {
  if (data?.stack?.error?.code === 458) {
    const deviceId = sessionToDeviceId[data?.stack?.session_id];
    if (deviceId) {
      delete sessions[deviceId];
      db.deletes('sessions', { deviceId })
        .run(pgPool)
        .catch((err) => logger.error('janusSessionLogger()', err));
    }
  }
  switch (type) {
    case 'warn': {
      logger.warn('minijanus', data);
      break;
    }
    case 'error': {
      logger.error('minijanus', data);
      break;
    }
    case 'debug': {
      logger.debug('minijanus', data);
      break;
    }
  }
};
