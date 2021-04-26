import asyncHandler from 'express-async-handler';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { pgPool } from '../../utils';

export const deviceToken = asyncHandler(async (req, res, _next) => {
  const { token, deviceId }: { token: string; deviceId: string } = req.body;
  await db.sql<s.users_devices.SQL>`
  UPDATE ${'users_devices'}
  SET ${'notificationToken'} = ${db.param(token)}
  WHERE ${'deviceId'} = ${db.param(deviceId)} AND ${'userId'} = ${db.param(
    req.user.id
  )}`.run(pgPool);
  return res.sendStatus(200);
});
