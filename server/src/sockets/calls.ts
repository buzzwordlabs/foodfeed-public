import {
  CallEndedData,
  MakesAnswerData,
  SocketJWT,
  StatusCallback,
  OfferAnswer
} from '../types';
import {
  findAllUsersInRooms,
  getRedisTopicsForUser,
  getRedisUserInfo,
  joinRoom,
  leaveRoom,
  setRedisCallData,
  showNumberOfOnlineUsersInWaitingRoom,
  unsetRedisCallData
} from './helpers';
import { isEmpty } from 'lodash';
import { logger, redis, amplitude, pgPool } from '../utils';
import {
  ServerCallEvents,
  ClientCallEvents,
  SocketRooms,
  AMPLITUDE_TRANSACTIONAL_EVENTS
} from './constants';
import * as s from '../zapatos/schema';
import * as db from '../zapatos/src';

type SafeAndAvailableOnlineUser = Pick<
  s.online_users.Selectable,
  'deviceId' | 'userId'
> &
  Pick<s.users.Selectable, 'username' | 'avatar'> & {
    isFollowing: boolean;
  } & { isFollower: boolean };

// The return type here is correct, there should only be one element in this array
const getSafeAndAvailableOnlineDeviceIds = async (
  userId: s.users.Selectable['id'],
  deviceId: string,
  socketId: SocketIO.Socket['id'],
  clients: string[]
): Promise<SafeAndAvailableOnlineUser[]> => {
  try {
    const remoteUser = await db.sql<
      | s.users.SQL
      | s.online_users.SQL
      | s.users_followers.SQL
      | s.users_blocklist.SQL,
      (Pick<s.online_users.Selectable, 'deviceId' | 'userId'> &
        Pick<s.users.Selectable, 'username' | 'avatar'> & {
          isFollowing: boolean;
        } & { isFollower: boolean })[]
    >`
      SELECT ${'online_users'}.${'deviceId'}, ${'online_users'}.${'userId'}, ${'users'}.${'username'}, ${'users'}.${'avatar'}, EXISTS (SELECT 1 from ${'users_followers'} WHERE ${'userId'}=${'users'}.${'id'} AND ${'followerId'}=${db.param(
      userId
    )}) AS "isFollowing", EXISTS (SELECT 1 FROM ${'users_followers'} WHERE ${'userId'}=${db.param(
      userId
    )} AND ${'followerId'}=${'users'}.${'id'}) AS "isFollower"
      FROM ${'online_users'}
      JOIN ${'users'} ON ${'online_users'}.${'userId'}=${'users'}.${'id'}
      WHERE ${'activeConnection'} IS NULL
      AND ${'online_users'}.${'isWaiting'} = ${db.param(true)}
      AND ${'online_users'}.${'socketId'} = ANY(${db.param(clients)})
      AND ${'online_users'}.${'socketId'} <> ${db.param(socketId)}
      AND NOT EXISTS (SELECT 1 FROM ${'users_blocklist'} WHERE (${'userId'}=${'online_users'}.${'userId'} AND ${'blockedId'}=${db.param(
      userId
    )}) OR (${'userId'}=${db.param(
      userId
    )} AND ${'blockedId'}=${'online_users'}.${'userId'}))
      ORDER BY random()
      LIMIT 1
    `.run(pgPool);
    if (remoteUser.length > 0) {
      try {
        await db.sql<
          s.online_users.SQL
        >`UPDATE ${'online_users'} SET ${'isWaiting'} = ${db.param(
          false
        )} WHERE ${'deviceId'} = ANY(${db.param([
          deviceId,
          remoteUser[0].deviceId
        ])})`.run(pgPool);
        await setRedisCallData(
          remoteUser[0].deviceId,
          { isWaiting: false },
          deviceId,
          { isWaiting: false }
        );
      } catch (err) {
        logger.error(
          'getSafeAndAvailableOnlineDeviceIds() remoteUser.length > 0',
          err
        );
      }
    }
    return remoteUser;
  } catch (err) {
    logger.error('getSafeAndAvailableOnlineDeviceIds()', err);
    return [];
  }
};

const findAndCallRandomUser = async (
  users: SafeAndAvailableOnlineUser[],
  socket: SocketJWT,
  deviceId: string,
  statusCb: StatusCallback
) => {
  if (users.length === 0) {
    statusCb('ok');
    socket.emit(ClientCallEvents.NO_USERS_FOUND_FOR_CALL);
    try {
      await amplitude.track({
        event_type: AMPLITUDE_TRANSACTIONAL_EVENTS.NO_FRIENDLY_CALLS,
        user_id: socket.userSession.id,
        device_id: deviceId
      });
    } catch (err) {
      logger.error('amplitude findAndCallRandomUser()', err);
    }
  }

  if (users[0]) {
    const remoteUser = users[0];

    statusCb('ok', {
      remoteDeviceId: remoteUser.deviceId,
      remoteUserInfo: {
        username: remoteUser.username,
        avatar: remoteUser.avatar,
        isFollowing: remoteUser.isFollowing,
        isFollower: remoteUser.isFollower
      }
    });
    const user = await getRedisUserInfo(socket.userSession.id, [
      'username',
      'avatar'
    ]);
    socket
      .to(remoteUser.deviceId)
      .emit(ClientCallEvents.REMOTE_POTENTIAL_MATCH, {
        remoteDeviceId: deviceId,
        remoteUserInfo: {
          username: user.username,
          avatar: user.avatar,
          isFollowing: remoteUser.isFollower,
          isFollower: remoteUser.isFollowing
        }
      });
  }
};

const callRandomWaitingRoomUser = async (
  io: SocketIO.Server,
  socket: SocketJWT,
  deviceId: string,
  statusCb: StatusCallback
) => {
  const clients = await findAllUsersInRooms(io, [SocketRooms.WAITING_ROOM]);
  const userDeviceIds = await getSafeAndAvailableOnlineDeviceIds(
    socket.userSession.id,
    deviceId,
    socket.id,
    clients
  );
  return findAndCallRandomUser(userDeviceIds, socket, deviceId, statusCb);
};

const createAndEmitCallHistory = async (
  calleeDeviceId: s.online_users.Selectable['deviceId'],
  calleeUserId: s.online_users.Selectable['userId'],
  calleeSocket: SocketJWT,
  callerDeviceId: s.online_users.Selectable['deviceId'],
  callerUserId: s.online_users.Selectable['userId']
) => {
  const callHistoryData: s.call_history.Insertable = {
    callerId: callerUserId,
    calleeId: calleeUserId,
    callerDeviceId,
    calleeDeviceId
  };
  const callHistory = await db.sql<
    s.call_history.SQL,
    Pick<s.call_history.Selectable, 'id'>[]
  >`INSERT INTO ${'call_history'} (${db.cols(
    callHistoryData
  )}) VALUES (${db.vals(callHistoryData)}) RETURNING ${'id'}`.run(pgPool);

  await setRedisCallData(
    calleeDeviceId,
    {
      callHistory: callHistory[0].id,
      activeConnection: callerDeviceId
    },
    callerDeviceId,
    { callHistory: callHistory[0].id, activeConnection: calleeDeviceId }
  );
  calleeSocket.emit(ClientCallEvents.ONE_TO_ONE_CALL_ID, {
    callId: callHistory[0].id
  });
  calleeSocket.to(callerDeviceId).emit(ClientCallEvents.ONE_TO_ONE_CALL_ID, {
    callId: callHistory[0].id
  });
  try {
    await amplitude.track({
      event_type: AMPLITUDE_TRANSACTIONAL_EVENTS.JOIN_CALL,
      user_id: callerUserId,
      event_properties: { users: [callerUserId, calleeUserId] }
    });
  } catch (err) {
    logger.error('amplitude createAndEmitCallHistory()', err);
  }
};

const findUsersToCall = async (
  io: SocketIO.Server,
  socket: SocketJWT,
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    const topics = await getRedisTopicsForUser(socket.userSession.id);
    if (!isEmpty(topics)) {
      const clients = await findAllUsersInRooms(io, topics);
      const userDeviceIds = await getSafeAndAvailableOnlineDeviceIds(
        socket.userSession.id,
        deviceId,
        socket.id,
        clients
      );
      if (userDeviceIds.length === 0) {
        return callRandomWaitingRoomUser(io, socket, deviceId, statusCb);
      }
      return findAndCallRandomUser(userDeviceIds, socket, deviceId, statusCb);
    }
    return callRandomWaitingRoomUser(io, socket, deviceId, statusCb);
  } catch (err) {
    logger.error('firstCallStarted()', err);
    socket.emit(ClientCallEvents.CALL_UNKNOWN_ERROR);
  }
};

const callAccepted = async (
  socket: SocketJWT,
  data: { remoteDeviceId: string },
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    const callAccepted = await redis.hget(data.remoteDeviceId, 'callAccepted');
    if (callAccepted) {
      socket.emit(ClientCallEvents.INITIATE_CALL);
    } else {
      await redis.hset(deviceId, 'callAccepted', 'true');
    }
    statusCb('ok');
  } catch (err) {
    logger.error('callAccepted()', err);
    statusCb('error');
  }
};

const callRejected = async (
  socket: SocketJWT,
  data: { remoteDeviceId: string },
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    socket.to(data.remoteDeviceId).emit(ClientCallEvents.REMOTE_CALL_REJECTED);
    await redis.hset(deviceId, 'isWaiting', 'true');
    await db.sql<
      s.online_users.SQL
    >`UPDATE ${'online_users'} SET ${'isWaiting'} = ${db.param(
      true
    )} WHERE ${'deviceId'} = ${db.param(deviceId)}`.run(pgPool);
    await Promise.all([
      redis.hdel(deviceId, 'callAccepted'),
      redis.hdel(data.remoteDeviceId, 'callAccepted')
    ]);

    statusCb('ok');
  } catch (err) {
    logger.error('callRejected()', err);
    statusCb('error');
  }
};

const rejoinWaitingRoom = async (
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    await db.sql<
      s.online_users.SQL
    >`UPDATE ${'online_users'} SET ${'isWaiting'} = ${db.param(
      true
    )} WHERE ${'deviceId'} = ${db.param(deviceId)}`.run(pgPool);
    await redis.hset(deviceId, 'isWaiting', 'true');
    statusCb('ok');
  } catch (err) {
    logger.error('rejoinWaitingRoom()', err);
    statusCb('error');
  }
};

const callerMakesOfferToCallee = async (
  io: SocketIO.Server,
  socket: SocketJWT,
  data: { remoteDeviceId: string; offer: OfferAnswer },
  statusCb: StatusCallback
) => {
  try {
    socket
      .to(data.remoteDeviceId)
      .emit(ClientCallEvents.CALLEE_RECEIVES_CALLER_OFFER, {
        offer: data.offer
      });
    await leaveRoom(io, socket.id, SocketRooms.WAITING_ROOM);
    await showNumberOfOnlineUsersInWaitingRoom(io);
    statusCb('ok');
  } catch (err) {
    logger.error('callerMakesOfferToCallee()', err);
    statusCb('error');
  }
};

const calleeMakesAnswerToCaller = async (
  io: SocketIO.Server,
  socket: SocketJWT,
  data: MakesAnswerData,
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    socket
      .to(data.remoteDeviceId)
      .emit(ClientCallEvents.CALLER_RECEIVES_CALLEE_ANSWER, {
        remoteDeviceId: deviceId,
        answer: data.answer
      });
    await db.sql<
      s.online_users.SQL
    >`UPDATE ${'online_users'} SET ${'activeConnection'} = ${db.param(
      data.remoteDeviceId
    )} WHERE ${'deviceId'} = ${db.param(deviceId)}`.run(pgPool);
    await db.sql<
      s.online_users.SQL
    >`UPDATE ${'online_users'} SET ${'activeConnection'} = ${db.param(
      deviceId
    )} WHERE ${'deviceId'} = ${db.param(data.remoteDeviceId)}`.run(pgPool);
    statusCb('ok');
    const remoteUserId = await redis.hget(data.remoteDeviceId, 'userId');

    if (remoteUserId) {
      await createAndEmitCallHistory(
        deviceId,
        socket.userSession.id,
        socket,
        data.remoteDeviceId,
        remoteUserId
      );
    }
    await leaveRoom(io, socket.id, SocketRooms.WAITING_ROOM);
    await showNumberOfOnlineUsersInWaitingRoom(io);
  } catch (err) {
    logger.error('secondMakesAnswerToFirstCall()', err);
    socket.emit(ClientCallEvents.CALL_UNKNOWN_ERROR);
    socket.to(data.remoteDeviceId).emit(ClientCallEvents.CALL_UNKNOWN_ERROR);
    await callEnded(socket, data, deviceId, false, () => {}, true);
  }
};

export const callEnded = async (
  socket: SocketJWT,
  data: CallEndedData,
  deviceId: string,
  disconnected: boolean,
  statusCb: StatusCallback,
  callError: boolean
) => {
  try {
    statusCb('ok');

    await db.sql<
      s.online_users.SQL
    >`UPDATE ${'online_users'} SET ${'activeConnection'} = NULL WHERE ${'deviceId'} = ANY(${db.param(
      [deviceId, data.remoteDeviceId]
    )})`.run(pgPool);
    const callId = await redis.hget(deviceId, 'callHistory');
    if (!callError && callId) {
      socket
        .to(data.remoteDeviceId)
        .emit(ClientCallEvents.REMOTE_USER_DISCONNECTED);
    }
    if (!disconnected) await unsetRedisCallData(deviceId, data.remoteDeviceId);
    else
      await redis.hdel(
        data.remoteDeviceId,
        'callHistory',
        'activeConnection',
        'callAccepted'
      );
    if (!callId) return;
    await db.sql<
      s.call_history.SQL
    >`UPDATE ${'call_history'} SET ${'completedAt'} = ${db.param(
      new Date()
    )} WHERE ${'id'} = ${db.param(callId)}`.run(pgPool);
  } catch (err) {
    logger.error('callEnded()', err);
    statusCb('error');
  }
};

const onIceCandidate = async (
  socket: SocketJWT,
  data: { candidate: string; remoteDeviceId: string },
  statusCb: StatusCallback
) => {
  try {
    socket
      .to(data.remoteDeviceId)
      .emit(ClientCallEvents.CALL_ON_ICE_CANDIDATE_RECEIVED, {
        candidate: data.candidate
      });
    statusCb('ok');
  } catch (err) {
    logger.error('onIceCandidate()', err);
    statusCb('error');
  }
};

// TODO BACKCOMPAT remove the two following events once everyone's on the new app version
const appMultimediaPaused = async (
  socket: SocketJWT,
  data: { remoteDeviceId: string },
  statusCb: StatusCallback
) => {
  try {
    socket.to(data.remoteDeviceId).emit(ClientCallEvents.CALL_USER_PAUSED);
    statusCb('ok');
  } catch (err) {
    logger.error('appMultimediaPaused()', err);
    statusCb('error');
  }
};

const appMultimediaUnpaused = async (
  socket: SocketJWT,
  data: { remoteDeviceId: string },
  statusCb: StatusCallback
) => {
  try {
    socket.to(data.remoteDeviceId).emit(ClientCallEvents.CALL_USER_UNPAUSED);
    statusCb('ok');
  } catch (err) {
    logger.error('appMultimediaUnpaused()', err);
    statusCb('error');
  }
};

const joinedWaitingRoom = async (
  io: SocketIO.Server,
  socket: SocketJWT,
  deviceId: s.online_users.Selectable['deviceId'],
  statusCb: StatusCallback
) => {
  try {
    await redis.hset(deviceId, 'isWaiting', 'true');
    await db.sql<
      s.online_users.SQL
    >`UPDATE ${'online_users'} SET ${'isWaiting'} = ${db.param(
      true
    )} WHERE ${'deviceId'} = ${db.param(deviceId)}`.run(pgPool);
    await joinRoom(io, socket.id, SocketRooms.WAITING_ROOM);
    await showNumberOfOnlineUsersInWaitingRoom(io);
    statusCb('ok');
  } catch (err) {
    logger.error('joinedWaitingRoom()', err);
    statusCb('error');
  }
};

const leaveWaitingRoom = async (
  io: SocketIO.Server,
  deviceId: s.online_users.Selectable['deviceId'],
  socketId: SocketIO.Socket['id'],
  statusCb: StatusCallback
) => {
  try {
    await redis.hdel(deviceId, 'isWaiting');
    await db.sql<
      s.online_users.SQL
    >`UPDATE ${'online_users'} SET ${'isWaiting'} = ${db.param(
      false
    )} WHERE ${'deviceId'} = ${db.param(deviceId)}`.run(pgPool);
    await leaveRoom(io, socketId, SocketRooms.WAITING_ROOM);
    await showNumberOfOnlineUsersInWaitingRoom(io);
    statusCb('ok');
  } catch (err) {
    logger.error('leaveWaitingRoom()', err);
    statusCb('error');
  }
};

export const initCalls = (
  io: SocketIO.Server,
  socket: SocketJWT,
  deviceId: string
) => {
  socket.on(ServerCallEvents.JOINED_WAITING_ROOM, (statusCb) =>
    joinedWaitingRoom(io, socket, deviceId, statusCb)
  );

  socket.on(ServerCallEvents.FIND_USERS_TO_CALL, (statusCb) =>
    findUsersToCall(io, socket, deviceId, statusCb)
  );

  socket.on(ServerCallEvents.CALL_ACCEPTED, (data, statusCb) =>
    callAccepted(socket, data, deviceId, statusCb)
  );

  socket.on(ServerCallEvents.CALL_REJECTED, (data, statusCb) =>
    callRejected(socket, data, deviceId, statusCb)
  );

  socket.on(ServerCallEvents.REJOIN_WAITING_ROOM, (statusCb) =>
    rejoinWaitingRoom(deviceId, statusCb)
  );

  socket.on(ServerCallEvents.CALLER_MAKES_OFFER_TO_CALLEE, (data, statusCb) =>
    callerMakesOfferToCallee(io, socket, data, statusCb)
  );

  socket.on(ServerCallEvents.CALLEE_MAKES_ANSWER_TO_CALLER, (data, statusCb) =>
    calleeMakesAnswerToCaller(io, socket, data, deviceId, statusCb)
  );

  socket.on(ServerCallEvents.CALL_ENDED, (data, statusCb) =>
    callEnded(socket, data, deviceId, false, statusCb, false)
  );

  socket.on(ServerCallEvents.CALL_ON_ICE_CANDIDATE, (data, statusCb) =>
    onIceCandidate(socket, data, statusCb)
  );

  socket.on(ServerCallEvents.LEAVE_WAITING_ROOM, (statusCb) =>
    leaveWaitingRoom(io, deviceId, socket.id, statusCb)
  );

  socket.on(ServerCallEvents.CALL_APP_PAUSED, (data, statusCb) =>
    appMultimediaPaused(socket, data, statusCb)
  );

  socket.on(ServerCallEvents.CALL_APP_UNPAUSED, (data, statusCb) =>
    appMultimediaUnpaused(socket, data, statusCb)
  );
};
