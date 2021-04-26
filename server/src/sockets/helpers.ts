import {
  CallRedisData,
  DeviceActivityInfoRedis,
  DeviceRedisInfo,
  RedisHsetObject,
  StreamRedisData,
  UserRedisData,
  SocketJWT,
  WaitingRedisData
} from '../types';
import { SocketRooms, ClientHelperEvents } from './constants';
import { isEmpty, zipObject } from 'lodash';
import {
  logger,
  redis,
  ONE_DAY_IN_SECONDS,
  ONE_WEEK_IN_SECONDS,
  pgPool
} from '../utils';
import * as db from '../zapatos/src';
import * as s from '../zapatos/schema';

import SocketIORedis from 'socket.io-redis';

export const joinRoom = async (
  io: SocketIO.Server,
  socketId: SocketIO.Socket['id'],
  room: string
) => {
  return new Promise((resolve, reject) => {
    (io.of('/').adapter as SocketIORedis.RedisAdapter).remoteJoin(
      socketId,
      room,
      (err: Error) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

export const leaveRoom = async (
  io: SocketIO.Server,
  socketId: SocketIO.Socket['id'],
  room: string
) => {
  return new Promise((resolve, _reject) => {
    (io.of('/').adapter as SocketIORedis.RedisAdapter).remoteLeave(
      socketId,
      room,
      (err: Error) => {
        if (err) {
          logger.error('leaveRoom()', err);
        }
        resolve();
      }
    );
  });
};

export const getRedisTopicsForUser = async (userId: string) => {
  const topicsString = await redis.hget(userId, 'topics');
  if (topicsString) {
    return JSON.parse(topicsString);
  }
};

export const getRedisUserInfo = async (
  userId: string,
  key?: (keyof UserRedisData)[]
) => {
  if (key) {
    const user = await redis.hmget(userId, ...key);
    return zipObject(key, user);
  }
  const user = await redis.hgetall(userId);
  if (user.topics) user.topics = JSON.parse(user.topics);
  return user;
};

export const setUserInRedis = async (
  userId: s.users.Selectable['id'],
  data: UserRedisData
) => {
  data.topics = JSON.stringify(data.topics) as any;
  await (redis as RedisHsetObject).hset(userId, data);
  return redis.expire(userId, ONE_WEEK_IN_SECONDS);
};

export const setDeviceInRedis = async (
  deviceId: s.online_users.Selectable['deviceId'],
  socketId: SocketJWT['id'],
  userId: s.users.Selectable['id']
) => {
  await (redis as RedisHsetObject).hset(deviceId, {
    socketId: socketId,
    userId: userId
  });
  await redis.expire(deviceId, ONE_DAY_IN_SECONDS);

  await redis.hset(`${userId}-sessions`, deviceId, socketId);
  await redis.expire(`${userId}-sessions`, ONE_WEEK_IN_SECONDS);
};

export const initStreamData = async ({
  deviceId,
  title,
  username,
  avatar,
  isStreaming,
  janusSession,
  streamHistory
}: {
  deviceId: string;
  title: string;
  username: string;
  avatar: string;
  isStreaming: s.online_users.Selectable['isStreaming'];
  janusSession: string;
  streamHistory: string;
}) => {
  const data: StreamRedisData = {
    username,
    avatar,
    upvote: 0,
    downvote: 0,
    title,
    isStreaming,
    janusSession: janusSession,
    streamHistory: streamHistory,
    videoPaused: false
  };
  return (redis as RedisHsetObject).hset(deviceId, data);
};

export const getRedisStreamData = async (
  deviceId: string,
  key?: (keyof StreamRedisData)[]
) => {
  if (key) {
    const streamData = await redis.hmget(deviceId, ...key);
    const streamDataObj = (zipObject(
      key,
      streamData
    ) as unknown) as StreamRedisData;
    if (streamDataObj.upvote)
      streamDataObj.upvote = Number(streamDataObj.upvote);
    if (streamDataObj.downvote)
      streamDataObj.downvote = Number(streamDataObj.downvote);
    if (streamDataObj.videoPaused)
      ((streamDataObj.videoPaused as unknown) as string) === 'true'
        ? (streamDataObj.videoPaused = true)
        : (streamDataObj.videoPaused = false);
    return streamDataObj;
  }
  const streamData = ((await redis.hgetall(
    deviceId
  )) as unknown) as StreamRedisData;
  if (!isEmpty(streamData)) {
    if (streamData.upvote) streamData.upvote = Number(streamData.upvote);
    if (streamData.downvote) streamData.downvote = Number(streamData.downvote);
    return streamData;
  }
};

export const setRedisViewerStreamData = async (
  deviceId: string,
  data: Partial<DeviceRedisInfo>
) => {
  return (redis as RedisHsetObject).hset(deviceId, data);
};

export const setRedisCallData = async (
  calleeDeviceId: string,
  calleeData: CallRedisData | WaitingRedisData,
  callerDeviceId: string,
  callerData: CallRedisData | WaitingRedisData
) => {
  return Promise.all([
    (redis as RedisHsetObject).hset(calleeDeviceId, calleeData),
    (redis as RedisHsetObject).hset(callerDeviceId, callerData)
  ]);
};

export const unsetRedisCallData = async (
  deviceId: string,
  remoteDeviceId: string
) => {
  return Promise.all([
    redis.hdel(deviceId, 'callHistory', 'activeConnection', 'callAccepted'),
    redis.hdel(
      remoteDeviceId,
      'callHistory',
      'activeConnection',
      'callAccepted'
    )
  ]);
};

export const unsetRedisActivityData = async (deviceId: string) => {
  return (redis as RedisHsetObject).hset(deviceId, {
    isViewing: false,
    activeConnection: null,
    isStreaming: false,
    janusSession: null
  });
};

export const getRedisDeviceActivityInfo = async (
  deviceId: string,
  keys?: (keyof DeviceActivityInfoRedis)[]
) => {
  if (keys) {
    const deviceRedisInfo = await redis.hmget(deviceId, ...keys);
    const redisValues = (zipObject(
      keys,
      deviceRedisInfo
    ) as unknown) as DeviceActivityInfoRedis;
    if (redisValues.isViewing)
      redisValues.isViewing =
        ((redisValues.isViewing as unknown) as string) === 'true';
    if (redisValues.isStreaming)
      redisValues.isStreaming =
        ((redisValues.isStreaming as unknown) as string) === 'true';
    if (redisValues.isWaiting)
      redisValues.isWaiting =
        ((redisValues.isWaiting as unknown) as string) === 'true';
    if (redisValues.inConversationRooms)
      redisValues.inConversationRooms =
        ((redisValues.inConversationRooms as unknown) as string) === 'true';
    return redisValues;
  }
  const deviceRedisInfo = await redis.hmget(
    deviceId,
    'isViewing',
    'activeConnection',
    'isStreaming',
    'isWaiting',
    'inConversationRooms'
  );
  const redisValues = (zipObject(
    [
      'isViewing',
      'activeConnection',
      'isStreaming',
      'isWaiting',
      'inConversationRooms'
    ],
    deviceRedisInfo
  ) as unknown) as DeviceActivityInfoRedis;
  redisValues.isViewing =
    ((redisValues.isViewing as unknown) as string) === 'true';
  redisValues.isStreaming =
    ((redisValues.isStreaming as unknown) as string) === 'true';
  redisValues.isWaiting =
    ((redisValues.isWaiting as unknown) as string) === 'true';
  if (redisValues.inConversationRooms)
    redisValues.inConversationRooms =
      ((redisValues.inConversationRooms as unknown) as string) === 'true';
  return redisValues;
};

export const findAllRoomsForUser = async (
  io: SocketIO.Server,
  socketId: SocketIO.Socket['id']
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    (io.of('/').adapter as SocketIORedis.RedisAdapter).clientRooms(
      socketId,
      (err, rooms) => {
        if (err) reject(err);
        else resolve(rooms);
      }
    );
  });
};

export const findAllUsersInRooms = async (
  io: SocketIO.Server,
  rooms: string[]
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    (io.of('/').adapter as SocketIORedis.RedisAdapter).clients(
      rooms,
      (err, clients) => {
        if (err) reject(err);
        else resolve(clients);
      }
    );
  });
};

export const countAllUsersInRooms = async (
  io: SocketIO.Server,
  rooms: string[]
) => {
  return (await findAllUsersInRooms(io, rooms)).length;
};

export const showNumberOfOnlineUsers = async (io: SocketIO.Server) => {
  try {
    const socketIds = await countAllUsersInRooms(io, [SocketRooms.GLOBAL_ROOM]);
    io.sockets.emit(ClientHelperEvents.NUMBER_ONLINE_USERS, {
      number: socketIds ? socketIds - 1 : 0
    });
  } catch (err) {
    logger.error('showNumberOfOnlineUsers()', err);
  }
};

export const showNumberOfOnlineUsersInWaitingRoom = async (
  io: SocketIO.Server
) => {
  try {
    const socketIds = await countAllUsersInRooms(io, [
      SocketRooms.WAITING_ROOM
    ]);
    io.sockets.emit(ClientHelperEvents.NUMBER_ONLINE_USERS_IN_WAITING_ROOM, {
      number: socketIds ? socketIds - 1 : 0
    });
  } catch (err) {
    logger.error('showNumberOfOnlineUsersInWaitingRoom()', err);
  }
};

export const kickUnknownOrBlockedUser = (
  io: SocketIO.Server,
  socketId: SocketIO.Socket['id']
) => {
  return new Promise((resolve, reject) => {
    (io.of('/').adapter as SocketIORedis.RedisAdapter).remoteDisconnect(
      socketId,
      true,
      (err) => {
        if (err) {
          logger.error('kickUnknownOrBlockedUser()', err);
          return reject(err);
        }
        return resolve();
      }
    );
  });
};

export const addUsertoRooms = async ({
  io,
  socketId,
  user,
  userInRedis,
  deviceId,
  deviceActivityInfo
}: {
  io: SocketIO.Server;
  socketId: SocketIO.Socket['id'];
  user: Pick<
    s.users.Selectable & { topics: s.users_topics.Selectable['topicId'][] },
    'id' | 'firstName' | 'lastName' | 'username' | 'avatar' | 'topics'
  >;
  userInRedis: boolean;
  deviceId: s.online_users.Selectable['deviceId'];
  deviceActivityInfo: DeviceActivityInfoRedis;
}) => {
  try {
    const userTopics: string[] = (user.topics as unknown) as string[];
    await Promise.all(
      userTopics.map(async (topic) => joinRoom(io, socketId, topic))
    );
    if (!userInRedis) {
      await setUserInRedis(user.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatar: user.avatar,
        topics: user.topics
      });
    } else {
      await redis.expire(user.id, ONE_WEEK_IN_SECONDS);
    }
    return db.sql<
      s.online_users.SQL
    >`INSERT INTO ${'online_users'} (${'socketId'}, ${'deviceId'}, ${'userId'}, ${'activeConnection'}, ${'isStreaming'}, ${'isViewing'}, ${'isWaiting'})
    VALUES (${db.param(socketId)}, ${db.param(deviceId)}, ${db.param(
      user.id
    )}, ${db.param(deviceActivityInfo.activeConnection)}, ${db.param(
      deviceActivityInfo.isStreaming ? true : false
    )}, ${db.param(deviceActivityInfo.isViewing ? true : false)}, ${db.param(
      deviceActivityInfo.isWaiting ? true : false
    )}) ON CONFLICT ON CONSTRAINT online_users_pkey
    DO
    UPDATE SET
    ${'socketId'}=EXCLUDED.${'socketId'},
    ${'userId'}=EXCLUDED.${'userId'},
    ${'activeConnection'}=EXCLUDED.${'activeConnection'},
    ${'isStreaming'}=EXCLUDED.${'isStreaming'},
    ${'isViewing'}=EXCLUDED.${'isViewing'},
    ${'isWaiting'}=EXCLUDED.${'isWaiting'}`.run(pgPool);
  } catch (err) {
    logger.error('addUserToRooms()', err);
  }
};
