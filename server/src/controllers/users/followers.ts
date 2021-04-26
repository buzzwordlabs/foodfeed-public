import asyncHandler from 'express-async-handler';
import {
  newFollowerNotification,
  extractNotificationTokensFromUsersDevices
} from '../../utils/pushNotifications';
import { logger, pgPool, redis, emitUnreadActivityCount } from '../../utils';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { UserRedisData } from '../../types';

export const getFollowingStatus = asyncHandler(async (req, res, _next) => {
  const username = req.query.username as string;
  const followingStatus = await db.sql<
    s.users_followers.SQL | s.users.SQL,
    Pick<s.users_followers.Selectable, 'userId'>[]
  >`
    SELECT${'userId'} FROM ${'users_followers'} WHERE ${'followerId'}=${db.param(
    req.user.id
  )} AND ${'userId'} IN (SELECT ${'id'} FROM ${'users'} WHERE ${'username'}=${db.param(
    username
  )} LIMIT 1)
  `.run(pgPool);
  return res.status(200).json({
    isFollowing: followingStatus.length > 0
  });
});

export const getUserFollowers = asyncHandler(async (req, res, _next) => {
  const username = req.query.username as string;
  const page: number = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const apiVersion = Number(req.query.apiVersion) || 1;
  if (apiVersion === 2) {
    const users = await db.sql<s.users.SQL | s.users_followers.SQL>`
    SELECT ${'users'}.${'firstName'}, ${'users'}.${'lastName'}, ${'users'}.${'username'}, ${'users'}.${'avatar'}
    FROM ${'users_followers'}
    JOIN ${'users'} ON ${'users_followers'}.${'followerId'}=${'users'}.${'id'}
    WHERE ${'users'}.${'banned'}=false AND ${'users_followers'}.${'userId'} IN (SELECT ${'id'} FROM ${'users'} WHERE ${'username'}=${db.param(
      username
    )} LIMIT 1)
    ORDER BY ${'users'}.${'id'} LIMIT ${db.param(pageSize)} OFFSET ${db.param(
      (page - 1) * pageSize
    )}`.run(pgPool);

    return res.status(200).json({
      page,
      pageSize,
      reachedEnd: users.length < pageSize,
      users
    });
  }
  const users = await db.sql<s.users.SQL | s.users_followers.SQL>`
    SELECT ${'users'}.${'firstName'}, ${'users'}.${'lastName'}, ${'users'}.${'username'}, ${'users'}.${'avatar'}, count(*) OVER()::INTEGER
    FROM ${'users_followers'}
    JOIN ${'users'} ON ${'users_followers'}.${'followerId'}=${'users'}.${'id'}
    WHERE ${'users'}.${'banned'}=false AND ${'users_followers'}.${'userId'} IN (SELECT ${'id'} FROM ${'users'} WHERE ${'username'}=${db.param(
    username
  )} LIMIT 1)
    ORDER BY ${'users'}.${'id'} LIMIT ${db.param(pageSize)} OFFSET ${db.param(
    (page - 1) * pageSize
  )}`.run(pgPool);

  const totalCount = users[0]?.count ?? 0;
  return res.status(200).json({
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    total: totalCount,
    count: users.length,
    users
  });
});

export const getUserFollowing = asyncHandler(async (req, res, _next) => {
  const username = req.query.username as string;
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const apiVersion = Number(req.query.apiVersion) || 1;

  if (apiVersion === 2) {
    const users = await db.sql<s.users.SQL | s.users_followers.SQL>`
  SELECT ${'users'}.${'firstName'}, ${'users'}.${'lastName'}, ${'users'}.${'username'}, ${'users'}.${'avatar'}
  FROM ${'users_followers'}
  JOIN ${'users'} ON ${'users_followers'}.${'userId'}=${'users'}.${'id'}
  WHERE ${'users'}.${'banned'}=false AND ${'users_followers'}.${'followerId'} IN (SELECT ${'id'} from ${'users'} WHERE ${'username'}=${db.param(
      username
    )} LIMIT 1)
  ORDER BY ${'users'}.${'id'} LIMIT ${db.param(pageSize)} OFFSET ${db.param(
      (page - 1) * pageSize
    )}`.run(pgPool);

    return res.status(200).json({
      page,
      pageSize,
      reachedEnd: users.length < pageSize,
      users
    });
  }

  const users = await db.sql<s.users.SQL | s.users_followers.SQL>`
  SELECT ${'users'}.${'firstName'}, ${'users'}.${'lastName'}, ${'users'}.${'username'}, ${'users'}.${'avatar'}, count(*) OVER()::INTEGER
  FROM ${'users_followers'}
  JOIN ${'users'} ON ${'users_followers'}.${'userId'}=${'users'}.${'id'}
  WHERE ${'users'}.${'banned'}=false AND ${'users_followers'}.${'followerId'} IN (SELECT ${'id'} from ${'users'} WHERE ${'username'}=${db.param(
    username
  )} LIMIT 1)
  ORDER BY ${'users'}.${'id'} LIMIT ${db.param(pageSize)} OFFSET ${db.param(
    (page - 1) * pageSize
  )}`.run(pgPool);

  const totalCount = users[0]?.count ?? 0;

  return res.status(200).json({
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    total: totalCount,
    count: users.length,
    users
  });
});

export const startFollowing = asyncHandler(async (req, res, _next) => {
  const { username }: { username: s.users.Selectable['username'] } = req.body;

  const followingUser = await db.sql<
    s.users.SQL | s.users_devices.SQL,
    (Pick<s.users.Selectable, 'id'> &
      Pick<s.users_devices.Selectable, 'notificationToken' | 'platform'>)[]
  >`SELECT ${'users'}.${'id'}, ${'users_devices'}.${'notificationToken'}, ${'users_devices'}.${'platform'}
  FROM ${'users'}
  LEFT JOIN ${'users_devices'} ON ${'users'}.${'id'}=${'users_devices'}.${'userId'} AND ${'users_devices'}.${'notificationToken'} IS NOT NULL
  WHERE ${'users'}.${'username'}=${db.param(username)}`.run(pgPool);

  if (followingUser.length === 0) return res.sendStatus(400);
  try {
    await db.sql<
      s.users_followers.SQL
    >`INSERT INTO ${'users_followers'} (${'userId'}, ${'followerId'}) VALUES (${db.param(
      followingUser[0].id
    )}, ${db.param(req.user.id)})`.run(pgPool);
  } catch (err) {
    return res.sendStatus(409);
  }
  res.sendStatus(200);
  try {
    const usernameStr: keyof Pick<UserRedisData, 'username'> = 'username';
    const myUsername = await redis.hget(req.user.id, usernameStr);
    const notificationTokens = extractNotificationTokensFromUsersDevices(
      followingUser
    );
    if (notificationTokens) {
      await newFollowerNotification({
        customData: { username: myUsername! },
        notificationTokens
      });
    }
    await emitUnreadActivityCount(followingUser[0].id);
  } catch (err) {
    logger.error('startFollowing() sendNotification', err);
  }
});

export const stopFollowing = asyncHandler(async (req, res, _next) => {
  const { username }: { username: s.users.Selectable['username'] } = req.body;
  const followingUser = await db.sql<
    s.users.SQL,
    Pick<s.users.Selectable, 'id'>[]
  >`SELECT ${'id'} FROM ${'users'}
  WHERE ${'username'} = ${db.param(username)}`.run(pgPool);
  if (followingUser.length === 0) return res.sendStatus(400);

  await db.sql<
    s.users.SQL | s.users_followers.SQL
  >`DELETE FROM ${'users_followers'}
    USING ${'users'} WHERE ${'users_followers'}.${'userId'}=${'users'}.${'id'}
    AND ${'users_followers'}.${'followerId'}=${db.param(
    req.user.id
  )} AND ${'users'}.${'username'} = ${db.param(username)}`.run(pgPool);
  return res.sendStatus(200);
});
