import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { jwt, logger, redis, pgPool } from '../../utils';

import apiClient from 'socket.io-client';
import { program } from 'commander';
import { SocketConnectionEvents } from '../../sockets/constants';
import { joinRoom } from '../../sockets/helpers';
import { io } from '../../server';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';

const socketConnections = [];

type StartSocketsArgs = {
  usernames: string;
};

export const createClientConnection = (
  url: string,
  authToken: string,
  deviceId: s.users_devices.Selectable['deviceId'],
  userId: s.users.Selectable['id']
) => {
  const apiSocketConn = apiClient.connect(url, {
    query: { deviceId: deviceId }
  });
  const clientAuthenticated = async (socket: SocketIOClient.Socket) => {
    if (socket) await joinRoom(io, socket.id, deviceId);
    db.insert('online_users', {
      deviceId: deviceId,
      userId: userId,
      socketId: apiSocketConn?.id,
      isViewing: false,
      streamTitle: 'hello',
      isStreaming: true
    });
    console.log('JANUS MANAGER AUTHENTICATED', deviceId);
  };
  const clientUnauthorized = () => {
    logger.error('CANNOT CONNECT TO JANUS SESSION MANAGER');
  };
  apiSocketConn.on('connect', () => {
    apiSocketConn
      .emit(SocketConnectionEvents.AUTHENTICATE, { token: authToken })
      .on(SocketConnectionEvents.AUTHENTICATED, clientAuthenticated)
      .on(SocketConnectionEvents.UNAUTHORIZED, clientUnauthorized);
  });
  apiSocketConn.on('disconnect', () => {
    apiSocketConn.off(
      SocketConnectionEvents.AUTHENTICATED,
      clientAuthenticated
    );
    apiSocketConn.off(SocketConnectionEvents.UNAUTHORIZED, clientUnauthorized);
  });
  return apiSocketConn;
};

const getUserWithoutUsername = async (usernames: string[]) =>
  db.sql<
    s.users.SQL | s.users_devices.SQL,
    (Pick<s.users.Selectable, 'id'> &
      Pick<s.users_devices.Selectable, 'deviceId'>)[]
  >`SELECT ${'users'}.${'id'}, ${'users_devices'}.${'deviceId'} FROM ${'users'} JOIN ${'users_devices'} ON ${'users'}.${'id'}=${'users_devices'}.${'userId'} WHERE ${'users'}.${'username'} <> ALL (${db.param(
    usernames
  )})`.run(pgPool);

const main = () => {
  const startSockets = async (args: StartSocketsArgs) => {
    const { usernames } = args;
    const usernamesArray = usernames.split(',');
    const currentUsers = await getUserWithoutUsername(usernamesArray);
    logger.info(`${currentUsers.length} USERS CONNECTED`);

    await Promise.all(
      currentUsers.map(async (user) => {
        await redis.hset(user.deviceId, 'isStreaming', 'true');
        await redis.expire(user.deviceId, 86400);
        const newJWT = (await jwt.create(user.id)) as string;
        const conn = createClientConnection(
          `http://localhost:${process.env.PORT || 8000}`,
          newJWT,
          user.deviceId,
          user.id
        );
        socketConnections.push(conn);
      })
    );
  };

  // Commands
  program
    .command('start-sockets')
    .requiredOption(
      '-u, --usernames <usernames>',
      'Your usernames to ignore, comma-separated values, DO NOT PUT ANY SPACES'
    )
    .action(async (args) => startSockets(args));

  program.parse(process.argv);
};

process.on('unhandledRejection', (reason, promise) => {
  console.error(`Unhandled Rejection at:', ${promise}\n, 'reason:', ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error(`Caught Exception ${err}\n`);
  process.exit(1);
});

main();
