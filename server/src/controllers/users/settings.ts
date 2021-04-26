import {
  customServerErrorResponse,
  redis,
  amplitude,
  logger,
  refreshUserRedisPermission,
  deleteFromS3Bucket,
  pgPool,
  getFollowingCount,
  getFollowersCount
} from '../../utils';

import asyncHandler from 'express-async-handler';
import { isEmpty } from 'lodash';
import {
  AMPLITUDE_ACCOUNT_EVENTS,
  RedisHsetObject,
  UserRedisData
} from '../../types';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';

export const updateAccountSettings = asyncHandler(async (req, res, _next) => {
  if (!req.file && isEmpty(req.body)) return res.sendStatus(200);
  const { firstName, lastName, bio }: Partial<s.users.Selectable> = req.body;
  const user = await db.sql<
    s.users.SQL,
    Pick<
      s.users.Selectable,
      'firstName' | 'lastName' | 'username' | 'avatar' | 'bio'
    >[]
  >`SELECT ${'id'}, ${'firstName'}, ${'lastName'}, ${'username'}, ${'avatar'}, ${'bio'} FROM ${'users'}
    WHERE ${'id'} = ${db.param(req.user.id)}`.run(pgPool);

  if (!user && req.file) {
    await deleteFromS3Bucket((req.file as Express.MulterS3.File).location);
  }
  if (!user) return res.sendStatus(401);
  const updatedUser: { [index: string]: string } = {};
  if (req.file) {
    if (user[0].avatar) {
      await deleteFromS3Bucket(user[0].avatar);
    }
    updatedUser.avatar = (req.file as Express.MulterS3.File).location;
  }
  if (firstName) updatedUser.firstName = firstName;
  if (lastName) updatedUser.lastName = lastName;
  if (bio && bio.length < 151) updatedUser.bio = bio;
  if (!isEmpty(updatedUser)) {
    await db.update('users', updatedUser, { id: req.user.id }).run(pgPool);
    const userexists = await redis.exists(req.user.id);
    if (userexists) {
      const userRedis: { [index: string]: string } = {};
      if (firstName) userRedis.firstName = firstName;
      if (lastName) userRedis.lastName = lastName;
      if (req.file)
        userRedis.avatar = (req.file as Express.MulterS3.File).location;
      if (!isEmpty(userRedis))
        await (redis as RedisHsetObject).hset(req.user.id, userRedis);
    }
  }
  return res.status(200).json({
    firstName: updatedUser.firstName ?? user[0].firstName,
    lastName: updatedUser.lastName ?? user[0].lastName,
    avatar: updatedUser.avatar ?? user[0].avatar,
    bio: updatedUser.bio ?? user[0].bio
  });
});

export const getUserInfo = asyncHandler(async (req, res, _next) => {
  const user = await db.sql<
    s.users.SQL,
    Pick<s.users.Selectable, 'firstName' | 'lastName' | 'avatar' | 'bio'>[]
  >`SELECT ${'firstName'}, ${'lastName'}, ${'bio'}, ${'avatar'} FROM ${'users'}
    WHERE ${'id'} = ${db.param(req.user.id)}`.run(pgPool);
  return res.status(200).json(user[0]);
});

export const updateUsername = asyncHandler(async (req, res, _next) => {
  const { username }: { username: string } = req.body;
  if ((await db.count('users', { username }).run(pgPool)) > 0) {
    return res.status(400).json(
      customServerErrorResponse({
        key: 'username',
        message: 'Username is already taken'
      })
    );
  }
  const user = await db.sql<
    s.users.SQL,
    Pick<s.users.Selectable, 'id' | 'username'>[]
  >`SELECT ${'id'}, ${'username'} FROM ${'users'}
    WHERE ${'id'} = ${db.param(req.user.id)}`.run(pgPool);

  if (user.length === 0) return res.sendStatus(401);
  await db.sql<s.users.SQL>`UPDATE ${'users'}
  SET ${'username'} = ${db.param(username)}
  WHERE ${'id'} = ${db.param(req.user.id)}`.run(pgPool);
  const usernameStr: keyof Pick<UserRedisData, 'username'> = 'username';
  const userexists = await redis.exists(req.user.id);
  if (userexists) {
    await redis.hset(req.user.id, usernameStr, username);
  }
  return res.sendStatus(200);
});

export const deleteAccount = asyncHandler(async (req, res, _next) => {
  const { password, reason }: { password: string; reason: string } = req.body;

  const user = await db.sql<
    s.users.SQL,
    {
      birthdate: s.users.Selectable['birthdate'];
      gender: s.users.Selectable['gender'];
      settings: s.users.Selectable['settings'];
      avatar: s.users.Selectable['avatar'];
      onboardingStep: s.users.Selectable['onboardingStep'];
      banned: s.users.Selectable['banned'];
    }[]
  >`SELECT ${'birthdate'}, ${'gender'}, ${'onboardingStep'}, ${'avatar'}, ${'settings'}, ${'banned'} FROM ${'users'} where ${'id'} = ${db.param(
    req.user.id
  )}
    AND ${'password'} = crypt(${db.param(password)}, ${'password'})`.run(
    pgPool
  );
  if (user.length === 0 || !user[0]) {
    return res.sendStatus(401);
  }

  const followingCount = await getFollowingCount(req.user.id);
  const followersCount = await getFollowersCount(req.user.id);
  const blockedUsersCount = await db
    .count('users_blocklist', {
      userId: req.user.id
    })
    .run(pgPool);
  const topics: {
    topicId: string;
  }[] = await db.sql<
    s.users_topics.SQL
  >`SELECT ${'topicId'} FROM ${'users_topics'} WHERE ${'userId'} = ${db.param(
    req.user.id
  )}`.run(pgPool);

  const numCalls = await db.sql<
    s.call_history.SQL,
    [{ count: number }?]
  >`SELECT COUNT(*)::INTEGER FROM ${'call_history'} WHERE ${'calleeId'}= ${db.param(
    req.user.id
  )} OR ${'callerId'} = ${db.param(req.user.id)}`.run(pgPool);

  const numStreams = await db
    .count('stream_history', {
      userId: req.user.id
    })
    .run(pgPool);

  const numPosts = await db
    .count('users_posts', { userId: req.user.id })
    .run(pgPool);

  const media = await db.sql<
    s.users_posts_media.SQL | s.users_posts.SQL,
    Pick<s.users_posts_media.Selectable, 'uri'>[]
  >`SELECT ${'users_posts_media'}.${'uri'} FROM ${'users_posts_media'}
  JOIN ${'users_posts'} ON ${'users_posts_media'}.${'postId'}=${'users_posts'}.${'id'}
  WHERE ${'users_posts'}.${'userId'}=${db.param(req.user.id)}`.run(pgPool);

  const streamRecordings = await db
    .select(
      'stream_history',
      {
        uri: db.sql<db.SQL>`${db.self} IS NOT NULL`,
        userId: req.user.id
      },
      { columns: ['uri'] }
    )
    .run(pgPool);

  await Promise.all(
    streamRecordings.map(async (recording) =>
      deleteFromS3Bucket(recording.uri!)
    )
  );

  await Promise.all(media.map(async (item) => deleteFromS3Bucket(item.uri)));

  await db
    .insert('deleted_users', {
      reason: reason,
      birthdate: user[0].birthdate,
      gender: user[0].gender,
      onboardingStep: user[0].onboardingStep,
      settings: user[0].settings,
      topics: topics.map((topic) => topic.topicId),
      following: followingCount,
      followers: followersCount,
      blockedUsers: blockedUsersCount,
      numCalls: numCalls[0]?.count ?? 0,
      numStreams: numStreams,
      numPosts: numPosts,
      banned: user[0].banned
    })
    .run(pgPool);

  await db.sql<s.users.SQL>`DELETE FROM ${'users'} WHERE ${'id'} = ${db.param(
    req.user.id
  )}`.run(pgPool);
  await redis.del(req.user.id);
  await refreshUserRedisPermission(req.user.id, 'false');
  if (user[0].avatar) await deleteFromS3Bucket(user[0].avatar);
  res.sendStatus(200);
  try {
    await amplitude.track({
      event_type: AMPLITUDE_ACCOUNT_EVENTS.DELETED_ACCOUNT,
      user_id: req.user.id
    });
  } catch (err) {
    logger.error('amplitude deleteAccount()', err);
  }
});

export const getBlocklist = asyncHandler(async (req, res, _next) => {
  const blockedUsers = await db.sql<
    s.users.SQL | s.users_blocklist.SQL
  >`SELECT ${'users'}.${'username'} FROM ${'users_blocklist'}
  JOIN ${'users'} ON ${'users'}.${'id'} = ${'users_blocklist'}.${'blockedId'}
  WHERE ${'users_blocklist'}.${'userId'} = ${db.param(req.user.id)}`.run(
    pgPool
  );
  return res.status(200).json({
    blockedUsers: blockedUsers
  });
});

export const modifyBlocklist = asyncHandler(async (req, res, _next) => {
  const {
    blockedUsers
  }: { blockedUsers: [{ username: string; blocked: boolean }] } = req.body;

  const unblockedOnly = blockedUsers
    .filter((blockedUser) => !blockedUser.blocked)
    .map((user) => user.username);

  await db.sql<
    s.users.SQL | s.users_blocklist.SQL
  >`DELETE FROM ${'users_blocklist'}
  USING ${'users'}
  WHERE ${'users'}.${'id'} = ${'users_blocklist'}.${'blockedId'}
  AND ${'users'}.${'username'} = ANY(${db.param(
    unblockedOnly
  )}) AND ${'users_blocklist'}.${'userId'} = ${db.param(req.user.id)}`.run(
    pgPool
  );
  return res.sendStatus(200);
});
