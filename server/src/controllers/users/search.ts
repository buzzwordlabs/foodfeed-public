import asyncHandler from 'express-async-handler';
import { getFollowingCount, getFollowersCount, pgPool } from '../../utils';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';

export const accounts = asyncHandler(async (req, res, _next) => {
  const username = req.query.username as string;
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const apiVersion = Number(req.query.apiVersion) || 1;

  if (apiVersion === 2) {
    let users;
    let recommended = false;
    users = await db.sql<
      s.users.SQL | s.online_users.SQL | s.users_blocklist.SQL,
      (Pick<
        s.users.Selectable,
        'username' | 'firstName' | 'lastName' | 'avatar'
      > & {
        isOnline: boolean;
      })[]
    >`
      SELECT DISTINCT ON (${'users'}.${'id'})
      ${'users'}.${'username'}, ${'users'}.${'firstName'}, ${'users'}.${'lastName'}, ${'users'}.${'avatar'},
      (CASE WHEN ${'online_users'}.${'deviceId'} IS NULL THEN FALSE ELSE TRUE END) AS "isOnline"
      FROM ${'users'}
      LEFT JOIN ${'online_users'} ON ${'users'}.${'id'} = ${'online_users'}.${'userId'}
      WHERE (${'users'}.${'username'} ILIKE ${db.param(
      `%${username}%`
    )} OR ${'users'}.${'fullName'} ILIKE ${db.param(
      `%${username}%`
    )}) AND ${'users'}.${'banned'}=${db.param(false)}
      AND NOT EXISTS
      (SELECT 1 FROM ${'users_blocklist'} WHERE (${'userId'}=${'users'}.${'id'} AND ${'blockedId'}=${db.param(
      req.user.id
    )}) OR (${'userId'}=${db.param(
      req.user.id
    )} AND ${'blockedId'}=${'users'}.${'id'}))
      ORDER BY ${'users'}.${'id'} LIMIT ${db.param(pageSize)} OFFSET ${db.param(
      (page - 1) * pageSize
    )}
  `.run(pgPool);
    if (users.length === 0 && page === 1) {
      users = await db.sql<
        s.users.SQL | s.online_users.SQL | s.users_blocklist.SQL,
        (Pick<
          s.users.Selectable,
          'username' | 'firstName' | 'lastName' | 'avatar'
        > & {
          isOnline: boolean;
        })[]
      >`
      SELECT DISTINCT ON (${'users'}.${'id'})
      ${'users'}.${'username'}, ${'users'}.${'firstName'}, ${'users'}.${'lastName'}, ${'users'}.${'avatar'},
      (CASE WHEN ${'online_users'}.${'deviceId'} IS NULL THEN FALSE ELSE TRUE END) AS "isOnline"
      FROM ${'users'}
      LEFT JOIN ${'online_users'} ON ${'users'}.${'id'} = ${'online_users'}.${'userId'}
      WHERE ${'users'}.${'banned'}=${db.param(
        false
      )} AND ${'users'}.${'avatar'} IS NOT NULL
      AND NOT EXISTS
      (SELECT 1 FROM ${'users_blocklist'} WHERE (${'userId'}=${'users'}.${'id'} AND ${'blockedId'}=${db.param(
        req.user.id
      )}) OR (${'userId'}=${db.param(
        req.user.id
      )} AND ${'blockedId'}=${'users'}.${'id'}))
      ORDER BY ${'users'}.${'id'}, random() LIMIT ${db.param(pageSize)}
  `.run(pgPool);
      recommended = true;
    }
    return res.status(200).json({
      page,
      pageSize,
      reachedEnd: users.length < pageSize || recommended,
      users,
      recommended
    });
  }

  const users = await db.sql<
    s.users.SQL | s.online_users.SQL | s.users_blocklist.SQL,
    (Pick<
      s.users.Selectable,
      'username' | 'firstName' | 'lastName' | 'avatar'
    > & {
      isOnline: boolean;
      count: number;
    })[]
  >`
      SELECT DISTINCT ON (${'users'}.${'id'})
      ${'users'}.${'username'}, ${'users'}.${'firstName'}, ${'users'}.${'lastName'}, ${'users'}.${'avatar'},
      (CASE WHEN ${'online_users'}.${'deviceId'} IS NULL THEN FALSE ELSE TRUE END) AS "isOnline", count(*) OVER()::INTEGER
      FROM ${'users'}
      LEFT JOIN ${'online_users'} ON ${'users'}.${'id'} = ${'online_users'}.${'userId'}
      WHERE (${'users'}.${'username'} ILIKE ${db.param(
    `%${username}%`
  )} OR ${'users'}.${'fullName'} ILIKE ${db.param(
    `%${username}%`
  )}) AND ${'users'}.${'banned'}=${db.param(false)}
      AND NOT EXISTS
      (SELECT 1 FROM ${'users_blocklist'} WHERE (${'userId'}=${'users'}.${'id'} AND ${'blockedId'}=${db.param(
    req.user.id
  )}) OR (${'userId'}=${db.param(
    req.user.id
  )} AND ${'blockedId'}=${'users'}.${'id'}))
      ORDER BY ${'users'}.${'id'} LIMIT ${db.param(pageSize)} OFFSET ${db.param(
    (page - 1) * pageSize
  )}
  `.run(pgPool);
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

export const profile = asyncHandler(async (req, res, _next) => {
  const username = req.params.username;

  const user = await db.sql<
    s.users.SQL | s.online_users.SQL | s.users_blocklist.SQL,
    (Pick<
      s.users.Selectable,
      'id' | 'username' | 'firstName' | 'lastName' | 'avatar' | 'bio'
    > &
      Pick<s.online_users.Selectable, 'deviceId' | 'isStreaming'> & {
        isBlocked: boolean;
        blockedBy: boolean;
      })[]
  >`
  SELECT ${'users'}.id, ${'users'}.${'firstName'}, ${'users'}.${'lastName'}, ${'users'}.${'avatar'}, ${'users'}.${'bio'}, ${'online_users'}.${'deviceId'}, ${'online_users'}.${'isStreaming'},
  EXISTS (SELECT 1 FROM ${'users_blocklist'} WHERE ${'userId'}=${'users'}.id AND ${'blockedId'}=${db.param(
    req.user.id
  )}) AS "blockedBy",
  EXISTS (SELECT 1 FROM ${'users_blocklist'} WHERE ${'userId'}=${db.param(
    req.user.id
  )} AND ${'blockedId'}=${'users'}.${'id'}) AS "isBlocked"
  FROM ${'users'}
  LEFT JOIN ${'online_users'} ON ${'users'}.id = ${'online_users'}.${'userId'}
  WHERE ${'users'}.${'username'}=${db.param(
    username
  )} AND ${'users'}.${'banned'}=${db.param(false)}
  `.run(pgPool);
  if (user.length === 0 || user[0].blockedBy) return res.sendStatus(400);

  if (user[0].isBlocked) {
    return res.status(200).json({
      isFollowing: false,
      isFollowedBy: false,
      firstName: user[0].firstName,
      lastName: user[0].lastName,
      avatar: user[0].avatar,
      bio: user[0].bio,
      isBlocked: user[0].isBlocked,
      streams: [],
      isOnline: false,
      countFollowing: await getFollowingCount(user[0].id),
      countFollowers: await getFollowersCount(user[0].id)
    });
  }

  const streams = user
    .filter((devices) => devices.isStreaming)
    .map((device) => device.deviceId);

  const followers = await db.sql<
    s.users_followers.SQL,
    s.users_followers.Selectable[]
  >`
      SELECT *
      FROM ${'users_followers'}
      WHERE
      ${'userId'} = ANY(${db.param([user[0].id, req.user.id])})
      AND ${'followerId'} = ANY(${db.param([user[0].id, req.user.id])})
      `.run(pgPool);

  let isFollowedBy;
  let isFollowing;
  if (followers.length === 2) {
    isFollowedBy = true;
    isFollowing = true;
  } else if (followers.length === 1) {
    followers[0].userId === req.user.id
      ? (isFollowedBy = true)
      : (isFollowing = true);
  }
  return res.status(200).json({
    isFollowing: !!isFollowing,
    isFollowedBy: !!isFollowedBy,
    firstName: user[0].firstName,
    lastName: user[0].lastName,
    avatar: user[0].avatar,
    bio: user[0].bio,
    isBlocked: user[0].isBlocked,
    streams: streams,
    isOnline: user[0].deviceId ? true : false,
    countFollowing: await getFollowingCount(user[0].id),
    countFollowers: await getFollowersCount(user[0].id)
  });
});

export const callHistory = asyncHandler(async (req, res, _next) => {
  const username = req.params.username;

  const user = await db.sql<
    s.users.SQL,
    Pick<s.users.Selectable, 'username'>[]
  >`SELECT ${'username'} FROM ${'users'}
  WHERE ${'id'} = ${db.param(req.user.id)}`.run(pgPool);
  if (username && username !== user[0].username) return res.sendStatus(400);

  const page: number = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const apiVersion = Number(req.query.apiVersion) || 1;

  if (apiVersion === 2) {
    const callHistoryData = await db.sql<
      s.users.SQL | s.call_history.SQL,
      {
        username: s.users.Selectable['username'];
        avatar: s.users.Selectable['avatar'];
        duration: s.call_history.Selectable['duration'];
        createdAt: s.call_history.Selectable['createdAt'];
      }[]
    >`
    SELECT
    ${'call_history'}.${'createdAt'},
    ${'call_history'}.${'duration'},
    (CASE WHEN u_caller."id" = ${db.param(
      req.user.id
    )} THEN u_callee.${'username'} ELSE u_caller.${'username'} END) AS "username",
    (CASE WHEN u_caller."id" = ${db.param(
      req.user.id
    )} THEN u_callee.${'avatar'} ELSE u_caller.${'avatar'} END) AS "avatar"
    FROM ${'call_history'}
    JOIN ${'users'} u_caller ON ${'call_history'}.${'callerId'} = u_caller.${'id'}
    JOIN ${'users'} u_callee ON ${'call_history'}.${'calleeId'} = u_callee.${'id'}
    WHERE (${'call_history'}.${'callerId'} = ${db.param(
      req.user.id
    )} OR ${'call_history'}.${'calleeId'} = ${db.param(req.user.id)})
    AND ${'duration'} >= 10
    ORDER BY ${'call_history'}.${'createdAt'} DESC LIMIT ${db.param(
      pageSize
    )} OFFSET ${db.param((page - 1) * pageSize)}
  `.run(pgPool);

    return res.status(200).json({
      page,
      pageSize,
      reachedEnd: callHistoryData.length < pageSize,
      callHistory: callHistoryData
    });
  }

  const callHistoryData = await db.sql<
    s.users.SQL | s.call_history.SQL,
    {
      username: s.users.Selectable['username'];
      avatar: s.users.Selectable['avatar'];
      duration: s.call_history.Selectable['duration'];
      createdAt: s.call_history.Selectable['createdAt'];
      count: number;
    }[]
  >`
    SELECT
    ${'call_history'}.${'createdAt'},
    ${'call_history'}.${'duration'},
    (CASE WHEN u_caller."id" = ${db.param(
      req.user.id
    )} THEN u_callee.${'username'} ELSE u_caller.${'username'} END) AS "username",
    (CASE WHEN u_caller."id" = ${db.param(
      req.user.id
    )} THEN u_callee.${'avatar'} ELSE u_caller.${'avatar'} END) AS "avatar",
    count(*) OVER()::INTEGER
    FROM ${'call_history'}
    JOIN ${'users'} u_caller ON ${'call_history'}.${'callerId'} = u_caller.${'id'}
    JOIN ${'users'} u_callee ON ${'call_history'}.${'calleeId'} = u_callee.${'id'}
    WHERE (${'call_history'}.${'callerId'} = ${db.param(
    req.user.id
  )} OR ${'call_history'}.${'calleeId'} = ${db.param(req.user.id)})
    AND ${'duration'} >= 10
    ORDER BY ${'call_history'}.${'createdAt'} DESC LIMIT ${db.param(
    pageSize
  )} OFFSET ${db.param((page - 1) * pageSize)}
  `.run(pgPool);

  const totalCallHistoryCount = callHistoryData[0]?.count ?? 0;

  const callHistoryDataLength = callHistoryData.length;

  return res.status(200).json({
    page,
    pageSize,
    totalPages: Math.ceil(totalCallHistoryCount / pageSize),
    total: totalCallHistoryCount,
    count: callHistoryDataLength,
    callHistory: callHistoryData
  });
});

export const streamHistory = asyncHandler(async (req, res, _next) => {
  const username = req.params.username;

  const page: number = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const apiVersion = Number(req.query.apiVersion) || 1;

  if (apiVersion === 2) {
    const streamHistoryData = await db.sql<
      s.stream_history.SQL | s.users.SQL | s.users_streams_reactions_total.SQL,
      Pick<s.stream_history.Selectable, 'title' | 'createdAt'> &
        { upvote: number; downvote: number }[]
    >`
    SELECT ${'duration'},
    COALESCE
    (
      (
        SELECT ${'count'} FROM ${'users_streams_reactions_total'} WHERE ${'streamId'} = ${'stream_history'}.${'id'} AND ${'users_streams_reactions_total'}.${'reaction'} = ${db.param(
      'upvote'
    )}
      ),
    0) AS "upvote",
    COALESCE
    (
      (
        SELECT ${'count'} FROM ${'users_streams_reactions_total'} WHERE ${'streamId'} = ${'stream_history'}.${'id'} AND ${'users_streams_reactions_total'}.${'reaction'} = ${db.param(
      'downvote'
    )}
      ),
    0) AS "downvote", ${'createdAt'}, ${'title'}, ${'thumbnail'}
    FROM ${'stream_history'}
    WHERE ${'userId'} IN (SELECT id FROM ${'users'} WHERE ${'username'} = ${db.param(
      username
    )} LIMIT 1)
    AND ${'duration'} >= 10
    ORDER BY ${'createdAt'} DESC LIMIT ${db.param(pageSize)} OFFSET ${db.param(
      (page - 1) * pageSize
    )}
  `.run(pgPool);

    return res.status(200).json({
      page,
      pageSize,
      reachedEnd: streamHistoryData.length < pageSize,
      streamHistory: streamHistoryData
    });
  }

  const streamHistoryData = await db.sql<
    s.stream_history.SQL | s.users.SQL | s.users_streams_reactions_total.SQL,
    (Pick<s.stream_history.Selectable, 'title' | 'createdAt'> & {
      count: number;
      upvote: number;
      downvote: number;
    })[]
  >`
    SELECT ${'duration'},
    COALESCE
    (
      (
        SELECT ${'count'} FROM ${'users_streams_reactions_total'} WHERE ${'streamId'} = ${'stream_history'}.${'id'} AND ${'users_streams_reactions_total'}.${'reaction'} = ${db.param(
    'upvote'
  )}
      ),
    0) AS "upvote",
    COALESCE
    (
      (
        SELECT ${'count'} FROM ${'users_streams_reactions_total'} WHERE ${'streamId'} = ${'stream_history'}.${'id'} AND ${'users_streams_reactions_total'}.${'reaction'} = ${db.param(
    'downvote'
  )}
      ),
    0) AS "downvote", ${'createdAt'}, ${'title'}, count(*) OVER()::INTEGER
    FROM ${'stream_history'}
    WHERE ${'userId'} IN (SELECT id FROM ${'users'} WHERE ${'username'} = ${db.param(
    username
  )} LIMIT 1)
    AND ${'duration'} >= 10
    ORDER BY ${'createdAt'} DESC LIMIT ${db.param(pageSize)} OFFSET ${db.param(
    (page - 1) * pageSize
  )}
  `.run(pgPool);

  const totalStreamHistoryCount = streamHistoryData[0]?.count ?? 0;

  const streamHistoryDataLength = streamHistoryData.length;

  return res.status(200).json({
    page,
    pageSize,
    totalPages: Math.ceil(totalStreamHistoryCount / pageSize),
    total: totalStreamHistoryCount,
    count: streamHistoryDataLength,
    streamHistory: streamHistoryData
  });
});

export const postHistory = asyncHandler(async (req, res, _next) => {
  const username = req.params.username;

  const page: number = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;

  const postData = await db.sql<
    s.users_posts.SQL | s.users_posts_media.SQL | s.users.SQL,
    {
      id: s.users_posts.Selectable['id'];
      media: [Omit<s.users_posts_media.Selectable, 'id'>];
    }[]
  >`
  SELECT ${'users_posts'}.${'id'},
    (SELECT json_agg(to_jsonb(${'users_posts_media'}) - 'id') FROM ${'users_posts_media'}
    WHERE ${'postId'}=${'users_posts'}.${'id'} AND ${'position'} = ${db.param(
    0
  )}) AS media
  FROM ${'users_posts'} WHERE ${'users_posts'}.${'userId'} IN (SELECT ${'id'} FROM ${'users'} WHERE ${'username'} = ${db.param(
    username
  )} LIMIT 1)
  ORDER BY ${'users_posts'}.${'createdAt'} DESC LIMIT ${db.param(
    pageSize
  )} OFFSET ${db.param((page - 1) * pageSize)}
    `.run(pgPool);

  return res.status(200).json({
    page,
    pageSize,
    reachedEnd: postData.length < pageSize,
    postHistory: postData
  });
});
