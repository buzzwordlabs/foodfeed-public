import asyncHandler from 'express-async-handler';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { pgPool } from '../../utils';

export const updateInfo = asyncHandler(async (req, res, _next) => {
  const { deviceId, appVersion, codePushVersion } = req.body;
  const user = await db.sql<
    s.users.SQL,
    Pick<
      s.users.Selectable,
      | 'firstName'
      | 'lastName'
      | 'username'
      | 'bio'
      | 'onboardingStep'
      | 'avatar'
    >[]
  >`SELECT ${'firstName'}, ${'lastName'}, ${'username'}, ${'bio'}, ${'onboardingStep'}, ${'avatar'} FROM ${'users'}
  WHERE ${'id'} = ${db.param(req.user.id)} AND ${'banned'} = ${db.param(
    false
  )}`.run(pgPool);
  if (user.length === 0) return res.sendStatus(403);
  await db.sql<s.users_devices.SQL>`
  UPDATE ${'users_devices'}
  SET ${'appVersion'} = ${db.param(
    appVersion
  )}, ${'codePushVersion'} = ${db.param(codePushVersion)}
  WHERE ${'deviceId'} = ${db.param(deviceId)} AND ${'userId'} = ${db.param(
    req.user.id
  )}`.run(pgPool);
  return res.status(200).json({
    firstName: user[0].firstName,
    lastName: user[0].lastName,
    username: user[0].username,
    bio: user[0].bio,
    onboardingStep: user[0].onboardingStep,
    avatar: user[0].avatar
  });
});
