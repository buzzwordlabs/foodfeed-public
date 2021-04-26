import { NextFunction, Request, Response } from 'express';
import {
  analytics,
  customServerErrorResponse,
  jwt,
  logger,
  pgPool,
  refreshUserRedisPermission,
  POSTGRES_DUP_ENTRY_ERROR_CODE
} from '../../utils';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';

import asyncHandler from 'express-async-handler';
import validator from 'validator';
import {
  FOODFEED_DB_USER_ID,
  IS_PRODUCTION,
  ETHAN_DB_USER_ID,
  ANI_DB_USER_ID
} from '../../config';

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      password,
      email,
      username,
      birthdate,
      deviceInfo
    }: {
      password: string;
      email: string;
      username: string;
      birthdate: Date;
      deviceInfo: s.users_devices.Insertable;
    } = req.body;
    const existingUsernames = await db.count('users', { username }).run(pgPool);
    if (existingUsernames > 0) {
      return res.status(400).json(
        customServerErrorResponse({
          key: 'username_taken',
          message: 'username is already taken'
        })
      );
    }
    const user: s.users.Insertable = {
      email,
      password: db.sql<db.SQL>`crypt(${db.param(
        password
      )}, gen_salt('bf', 12))`,
      username,
      onboardingStep: 1,
      banned: false,
      birthdate
    };
    const newUser = await db.sql<s.users.SQL, Pick<s.users.Selectable, 'id'>[]>`
    INSERT INTO ${'users'} (${db.cols(user)})
    VALUES (${db.vals(user)}) RETURNING ${'id'}`.run(pgPool);

    const device: s.users_devices.Insertable = {
      ...deviceInfo,
      userId: newUser[0].id
    };
    await db.sql<s.users_devices.SQL>`
    INSERT INTO ${'users_devices'} (${db.cols(device)})
    VALUES (${db.vals(device)})`.run(pgPool);

    analytics.event('User', 'Signed Up').send();
    const newJWT = await jwt.create(newUser[0].id);
    await refreshUserRedisPermission(newUser[0].id, 'true');

    res.status(200).json({ authToken: newJWT, userId: newUser[0].id });

    try {
      if (IS_PRODUCTION) {
        await db.sql<s.users_followers.SQL>`
        INSERT INTO ${'users_followers'} (${'followerId'}, ${'userId'})
        VALUES
        (${db.param(newUser[0].id)}, ${db.param(FOODFEED_DB_USER_ID)}),
        (${db.param(ETHAN_DB_USER_ID)}, ${db.param(newUser[0].id)}),
        (${db.param(ANI_DB_USER_ID)}, ${db.param(newUser[0].id)})`.run(pgPool);
      }
    } catch (err) {
      logger.error('Error following users signup()', err);
    }
  } catch (err) {
    if (err.code === POSTGRES_DUP_ENTRY_ERROR_CODE) {
      return res.sendStatus(409);
    }
    next(err);
  }
};

export const signin = asyncHandler(async (req, res, _next) => {
  const {
    usernameOrEmail,
    password,
    deviceInfo
  }: {
    usernameOrEmail: string;
    password: string;
    deviceInfo: s.users_devices.Insertable;
  } = req.body;

  const isEmail = validator.isEmail(usernameOrEmail);
  const user = await db.sql<
    s.users.SQL,
    Pick<
      s.users.Selectable,
      | 'id'
      | 'firstName'
      | 'lastName'
      | 'username'
      | 'avatar'
      | 'bio'
      | 'onboardingStep'
    >[]
  >`SELECT ${'id'}, ${'firstName'}, ${'lastName'}, ${'username'}, ${'avatar'}, ${'bio'}, ${'onboardingStep'} FROM ${'users'}
    WHERE ${isEmail ? 'email' : 'username'}=${db.param(
    isEmail ? validator.normalizeEmail(usernameOrEmail) : usernameOrEmail
  )}
    AND ${'password'} = crypt(${db.param(password)}, ${'password'})`.run(
    pgPool
  );
  if (user.length === 0) {
    return res.sendStatus(401);
  }
  analytics.event('User', 'Logged In').send();
  if (
    (await db
      .count('users_devices', {
        userId: user[0].id,
        deviceId: deviceInfo.deviceId
      })
      .run(pgPool)) === 0
  ) {
    const device: s.users_devices.Insertable = {
      ...deviceInfo,
      userId: user[0].id
    };
    await db.sql<s.users_devices.SQL>`
    INSERT INTO ${'users_devices'} (${db.cols(device)})
    VALUES (${db.vals(device)})`.run(pgPool);
  }
  const newJWT = await jwt.create(user[0].id);
  await refreshUserRedisPermission(user[0].id, 'true');
  res.status(200).json({
    authToken: newJWT,
    userId: user[0].id,
    firstName: user[0].firstName,
    lastName: user[0].lastName,
    username: user[0].username,
    avatar: user[0].avatar || '',
    bio: user[0].bio,
    onboardingStep: user[0].onboardingStep
  });
  try {
    return db.sql<
      s.users_devices.SQL
    >`UPDATE ${'users_devices'} SET ${'notificationToken'} = NULL WHERE ${'deviceId'} = ${db.param(
      deviceInfo.deviceId
    )} AND ${'userId'} <> ${db.param(user[0].id)}`.run(pgPool);
  } catch (err) {
    logger.error('signin() clearing notificationToken error', err);
  }
});
