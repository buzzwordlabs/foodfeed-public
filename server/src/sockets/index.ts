import {
  IceConfiguration,
  SocketJWT,
  StatusCallback,
  AMPLITUDE_ACTIVITY_EVENTS
} from '../types';
import {
  JWT_SECRET,
  REDIS_URL,
  TURN_REST_API_SECRET,
  TURN_REST_API_URLS_ARRAY,
  IS_PRODUCTION,
  REDIS_PROD_CLUSTER_HOSTS_ARRAY
} from '../config';
import {
  addUsertoRooms,
  getRedisDeviceActivityInfo,
  joinRoom,
  kickUnknownOrBlockedUser,
  showNumberOfOnlineUsersInWaitingRoom,
  setDeviceInRedis,
  getRedisUserInfo
} from './helpers';
import { callEnded, initCalls } from './calls';
import { initStreams, leaveStream, streamEnded } from './streams';
import { logger, redis, pgPool, amplitude } from '../utils';
import Redis from 'ioredis';
import { CronJob } from 'cron';
import crypto from 'crypto';
import { initManagerConnections } from './janusmanagerclientsocket';
import redisAdapter, { RedisAdapter } from 'socket.io-redis';
import socketioJwt from 'socketio-jwt';
import { SocketConnectionEvents, SocketRooms } from './constants';
import { isEmpty } from 'lodash';
import * as db from '../zapatos/src';
import * as s from '../zapatos/schema';
import { initConversations } from './conversations';

const disconnectUser = async (
  io: SocketIO.Server,
  socket: SocketJWT,
  deviceId: string
) => {
  try {
    const reconnectionAttempts = await redis.hget(
      deviceId,
      'reconnectionAttempts'
    );
    if (reconnectionAttempts && Number(reconnectionAttempts) > 0) {
      await redis.hincrby(deviceId, 'reconnectionAttempts', -1);
    } else {
      logger.info('USER DISCONNECTED', socket.id, deviceId);
      const userDeviceActivity = await getRedisDeviceActivityInfo(deviceId);
      if (userDeviceActivity) {
        if (
          userDeviceActivity.activeConnection &&
          userDeviceActivity.isViewing
        ) {
          await leaveStream(
            io,
            socket,
            socket.id,
            {
              remoteDeviceId: userDeviceActivity.activeConnection
            },
            deviceId,
            true,
            false,
            () => {}
          );
        } else if (userDeviceActivity.activeConnection) {
          await callEnded(
            socket,
            {
              remoteDeviceId: userDeviceActivity.activeConnection
            },
            deviceId,
            true,
            () => {},
            false
          );
        } else if (userDeviceActivity.isStreaming) {
          await streamEnded(io, socket, deviceId, true);
        } else if (userDeviceActivity.isWaiting) {
          await showNumberOfOnlineUsersInWaitingRoom(io);
        }
        await Promise.all([
          redis.del(deviceId),
          redis.hdel(`${socket.userSession.id}-sessions`, deviceId)
        ]);
        const sessionStart = await db.sql<
          s.online_users.SQL
        >`DELETE FROM ${'online_users'} WHERE ${'deviceId'} = ${db.param(
          deviceId
        )} RETURNING ${'createdAt'}`.run(pgPool);
        if (sessionStart.length > 0) {
          await amplitude.track({
            event_type: AMPLITUDE_ACTIVITY_EVENTS.SESSION_DURATION,
            user_id: socket.userSession.id,
            event_properties: {
              start: sessionStart[0].createdAt,
              end: new Date()
            }
          });
        }
      }
      // TODO re-enable when used
      // return showNumberOfOnlineUsers(io);
    }
  } catch (err) {
    logger.error('disconnectUser()', err);
  }
};

let turnServerIndex = 0;

const initIceConfig = (socket: SocketJWT, deviceId: string) => {
  socket.on('get_ice_configuration', (statusCb: StatusCallback) => {
    const configuration: IceConfiguration = {
      iceServers: [
        { url: 'stun:stun.l.google.com:19302' },
        { url: 'stun:global.stun.twilio.com:3478?transport=udp' }
      ]
    };
    const url = TURN_REST_API_URLS_ARRAY[turnServerIndex];
    turnServerIndex = (turnServerIndex + 1) % TURN_REST_API_URLS_ARRAY.length;
    const unixTimeStamp = Math.floor(Date.now() / 1000) + 24 * 3600;
    const username = [unixTimeStamp, deviceId].join(':');
    const hmac = crypto.createHmac('sha1', TURN_REST_API_SECRET!);
    hmac.setEncoding('base64');
    hmac.write(username);
    hmac.end();
    const password = hmac.read();
    configuration.iceServers.push({
      url: 'turn:' + url + ':3478',
      username: username,
      credential: password
    });
    configuration.iceServers.push({
      url: 'turns:' + url + ':443',
      username: username,
      credential: password
    });
    statusCb('ok', configuration);
  });
};

const checkConnectionsCron = (io: SocketIO.Server) => {
  const checkConnectionsJob = new CronJob('*/30 * * * *', async () => {
    try {
      return initManagerConnections(io);
    } catch (err) {
      logger.error('checkConnectionsCron()', err);
    }
  });
  checkConnectionsJob.start();
};

export const startSockets = async (io: SocketIO.Server) => {
  try {
    await initManagerConnections(io);
    checkConnectionsCron(io);
    io.adapter(
      redisAdapter(
        // @ts-ignore
        IS_PRODUCTION
          ? {
              pubClient: new Redis.Cluster(REDIS_PROD_CLUSTER_HOSTS_ARRAY!),
              subClient: new Redis.Cluster(REDIS_PROD_CLUSTER_HOSTS_ARRAY!)
            }
          : REDIS_URL!
      )
    );
    io.on(
      SocketConnectionEvents.CONNECTION,
      socketioJwt.authorize({
        secret: JWT_SECRET!,
        decodedPropertyName: SocketConnectionEvents.USER_SESSION
      })
    ).on(SocketConnectionEvents.AUTHENTICATED, async (socket: SocketJWT) => {
      try {
        const deviceId = socket.handshake.query.deviceId;

        if (!deviceId) {
          socket.emit('unauthorized', {
            data: { reason: 'No device ID found' }
          });
          return kickUnknownOrBlockedUser(io, socket.id);
        }
        socket.on(SocketConnectionEvents.DISCONNECT, () =>
          disconnectUser(io, socket, deviceId)
        );
        logger.info('USER CONNECTED', socket.id, deviceId);
        const networkSwitch = socket.handshake.query.networkSwitch === 'true';
        if (networkSwitch) {
          const [socketId, reconnectionAttempts] = await redis.hmget(
            deviceId,
            'socketId',
            'reconnectionAttempts'
          );
          if (reconnectionAttempts) {
            await redis.hincrby(deviceId, 'reconnectionAttempts', 1);
          } else {
            await redis.hset(deviceId, 'reconnectionAttempts', 1);
          }
          if (socketId) {
            (io.of('/').adapter as RedisAdapter).remoteDisconnect(
              socketId,
              true,
              async (err) => {
                if (err) {
                  await redis.hincrby(deviceId, 'reconnectionAttempts', -1);
                }
              }
            );
          } else {
            await redis.hincrby(deviceId, 'reconnectionAttempts', -1);
          }
        }
        const isAllowed = await redis.get(`${socket.userSession.id}-allowed`);
        if (isAllowed === 'false') {
          return kickUnknownOrBlockedUser(io, socket.id);
        }
        let user;
        let userInRedis = false;
        const userRedis = await getRedisUserInfo(socket.userSession.id);
        if (!isEmpty(userRedis)) {
          user = userRedis;
          userInRedis = true;
        } else {
          user = (
            await db.sql<
              s.users.SQL | s.users_topics.SQL,
              (Pick<
                s.users.Selectable,
                'firstName' | 'lastName' | 'username' | 'avatar' | 'id'
              > & { topics: s.users_topics.Selectable['topicId'][] })[]
            >`SELECT ${'id'}, ${'firstName'}, ${'lastName'}, ${'username'}, ${'avatar'}, ARRAY(SELECT ${'topicId'} FROM ${'users_topics'} WHERE ${'userId'} = ${db.param(
              socket.userSession.id
            )}) AS "topics" FROM ${'users'}
            WHERE ${'id'} = ${db.param(
              socket.userSession.id
            )} AND ${'banned'} = ${db.param(false)}`.run(pgPool)
          )[0];
        }
        if (!user || isEmpty(user)) {
          return kickUnknownOrBlockedUser(io, socket.id);
        }
        if (!user.id) {
          user.id = socket.userSession.id;
        }

        await setDeviceInRedis(deviceId, socket.id, user.id);

        const deviceActivityInfo = await getRedisDeviceActivityInfo(deviceId);
        if (
          deviceActivityInfo.activeConnection &&
          deviceActivityInfo.isViewing
        ) {
          await joinRoom(io, socket.id, deviceActivityInfo.activeConnection);
        }
        if (deviceActivityInfo.isWaiting) {
          await joinRoom(io, socket.id, SocketRooms.WAITING_ROOM);
          await showNumberOfOnlineUsersInWaitingRoom(io);
        }
        await addUsertoRooms({
          io: io,
          socketId: socket.id,
          user: user! as Pick<
            s.users.Selectable & {
              topics: s.users_topics.Selectable['topicId'][];
            },
            'id' | 'firstName' | 'lastName' | 'username' | 'avatar' | 'topics'
          >,
          userInRedis,
          deviceId,
          deviceActivityInfo
        });
        await joinRoom(io, socket.id, deviceId);
        await joinRoom(io, socket.id, SocketRooms.GLOBAL_ROOM);
        // TODO re-enable when used
        // await showNumberOfOnlineUsers(io);
        initIceConfig(socket, deviceId);
        initCalls(io, socket, deviceId);
        initStreams(io, socket, deviceId);
        initConversations(
          io,
          socket,
          deviceId,
          deviceActivityInfo.inConversationRooms ?? false
        );
      } catch (err) {
        logger.error('socket on("authenticated")', err);
      }
    });
  } catch (err) {
    logger.error('startSockets()', err);
  }
};
