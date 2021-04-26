import asyncHandler from 'express-async-handler';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { redis, refreshUserRedisPermission, pgPool } from '../../utils';
import { retrieveClientConnectionFromRedis } from '../../sockets/janusmanagerclientsocket';

const kickOutOfStream = async (deviceId: string, isStreaming: boolean) => {
  const janusManagerSocket = await retrieveClientConnectionFromRedis(deviceId);
  janusManagerSocket?.emit(
    isStreaming ? 'stream_ended_janus' : 'viewer_left_stream_janus',
    {
      deviceId: deviceId
    },
    (_status: string) => {}
  );
};

export const banUser = asyncHandler(async (req, res, _next) => {
  const { username } = req.body;
  const currentUsers = await db.sql<
    s.users.SQL | s.online_users.SQL,
    (Pick<s.users.Selectable, 'id'> &
      Pick<s.online_users.Selectable, 'deviceId'>)[]
  >`SELECT ${'users'}.${'id'}, ${'online_users'}.${'deviceId'} FROM ${'users'} JOIN ${'online_users'} ON ${'users'}.${'id'}=${'online_users'}.${'userId'} WHERE ${'users'}.${'username'}=${db.param(
    username
  )}`.run(pgPool);
  await Promise.all(
    currentUsers.map(async (user) => {
      const isStreaming =
        (await redis.hget(user.deviceId, 'isStreaming')) === 'true';
      await kickOutOfStream(user.deviceId, isStreaming);
      await redis.del(user.deviceId);
      await redis.del(user.id);
      await refreshUserRedisPermission(user.id, 'false');
      await db.deletes('online_users', { deviceId: user.deviceId }).run(pgPool);
    })
  );
  await db
    .update('users', { banned: true }, { id: currentUsers[0].id })
    .run(pgPool);
  return res.sendStatus(200);
});
