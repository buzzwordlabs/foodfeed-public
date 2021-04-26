import { logger, pgPool } from '../utils';

import { initStreamsJanusEvents } from './streams';
import { JanusManagerErrorEvents, SocketConnectionEvents } from './constants';
import { connect } from './sessions';
import * as db from '../zapatos/src';
import * as s from '../zapatos/schema';

let failedManagerEventsEmitted = false;
export const socketIds: string[] = [];
let establishedJanusConnection = false;

export const emitErrorFailedSessions = async (
  io: SocketIO.Server,
  socket?: SocketIO.Socket
) => {
  try {
    failedManagerEventsEmitted = true;
    const streamers = await db.sql<
      s.sessions.SQL,
      s.sessions.Selectable[]
    >`SELECT * FROM ${'sessions'} WHERE ${{ isStreaming: true }}`.run(pgPool);
    if (streamers.length > 0) {
      logger.info('Emitting failed sessions..');
      if (socket) {
        socket.emit(JanusManagerErrorEvents.JANUS_MANAGER_CRASHED, streamers);
      } else {
        if (socketIds.length > 0) {
          // emit to some random socket, some api server will get it correct
          io.to(socketIds[0]).emit(
            JanusManagerErrorEvents.JANUS_MANAGER_CRASHED,
            streamers
          );
        }
      }
      await db.truncate('sessions').run(pgPool);
    }
  } catch (err) {
    logger.error('emitErrorFailedSessions()', err);
  }
};

const disconnectUser = async (socket: SocketIO.Socket) => {
  try {
    const index = socketIds.findIndex((val) => val === socket.id);
    if (index !== -1) {
      socketIds.splice(index, 1);
    }
  } catch (err) {
    logger.error('disconnectUser()', err);
  }
};

export const startSockets = (io: SocketIO.Server) => {
  io.on(SocketConnectionEvents.CONNECTION, (socket) => {
    socketIds.push(socket.id);
    if (!establishedJanusConnection) {
      establishedJanusConnection = true;
      connect();
    }
    if (!failedManagerEventsEmitted) {
      emitErrorFailedSessions(io, socket).catch((err) =>
        logger.error('emitErrorFailedSessions()', err)
      );
    }
    initStreamsJanusEvents(socket);
    socket.on(SocketConnectionEvents.DISCONNECT, () => disconnectUser(socket));
  });
};
