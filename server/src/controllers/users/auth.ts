import asyncHandler from 'express-async-handler';
import { pgPool } from '../../utils';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
export const logoutUser = asyncHandler(async (req, res, _next) => {
  const { deviceId } = req.body;
  await db.sql<
    s.users_devices.SQL
  >`UPDATE ${'users_devices'} SET ${'notificationToken'} = NULL WHERE ${'userId'} = ${db.param(
    req.user.id
  )} AND ${'deviceId'} = ${db.param(deviceId)}`.run(pgPool);
  return res.sendStatus(200);
});
