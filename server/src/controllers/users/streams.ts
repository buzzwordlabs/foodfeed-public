import { isEmpty, zipObject } from 'lodash';

import asyncHandler from 'express-async-handler';
import { redis, pgPool } from '../../utils';
import { countAllUsersInRooms } from '../../sockets/helpers';
import { io } from '../../server';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';

export const uploadThumbnail = asyncHandler(async (req, res, _next) => {
  if (!req.file && isEmpty(req.body)) return res.sendStatus(400);
  await db.sql<s.online_users.SQL>`
  UPDATE ${'online_users'}
  SET ${'thumbnail'} = ${db.param((req.file as Express.MulterS3.File).location)}
  WHERE ${'deviceId'} = ${db.param(req.body.deviceId)}`.run(pgPool);
  return res.sendStatus(200);
});

export const getListOfStreams = asyncHandler(async (req, res, _next) => {
  const page: number = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const apiVersion = Number(req.query.apiVersion) || 1;

  if (apiVersion === 2) {
    const getLiveStreams = await db.sql<
      | s.users.SQL
      | s.online_users.SQL
      | s.users_blocklist.SQL
      | s.users_followers.SQL,
      {
        deviceId: s.online_users.Selectable['deviceId'];
        streamTitle: s.online_users.Selectable['streamTitle'];
        avatar: s.users.Selectable['avatar'];
        username: s.users.Selectable['username'];
        thumbnail: s.online_users.Selectable['thumbnail'];
        isFollowing: boolean;
      }[]
    >`SELECT ${'online_users'}.${'deviceId'}, ${'online_users'}.${'streamTitle'}, ${'online_users'}.${'thumbnail'}, ${'users'}.${'avatar'}, ${'users'}.${'username'},
    EXISTS (SELECT 1 FROM ${'users_followers'} WHERE ${'userId'}=${'online_users'}.${'userId'} AND ${'followerId'}=${db.param(
      req.user.id
    )}) AS "isFollowing"
      FROM ${'users'}
      JOIN ${'online_users'} ON ${'users'}.${'id'} = ${'online_users'}.${'userId'}
      WHERE ${'online_users'}.${'isStreaming'} = ${db.param(true)} AND
      NOT EXISTS
      (
        SELECT 1 FROM ${'users_blocklist'} WHERE (${'userId'}=${'online_users'}.${'userId'} AND ${'blockedId'} = ${db.param(
      req.user.id
    )}) OR (${'userId'} = ${db.param(
      req.user.id
    )} AND ${'blockedId'}=${'online_users'}.${'userId'})
      )
      ORDER BY ${'online_users'}.${'updatedAt'} DESC LIMIT ${db.param(
      pageSize
    )} OFFSET ${db.param((page - 1) * pageSize)}
  `.run(pgPool);

    const results = await Promise.all(
      getLiveStreams.map(async (user) =>
        redis.hmget(user.deviceId, 'upvote', 'downvote')
      )
    );
    await Promise.all(
      results.map(async (result, index) => {
        Object.assign(
          getLiveStreams[index],
          zipObject(['upvote', 'downvote'], result),
          {
            numViewers:
              (await countAllUsersInRooms(io, [
                getLiveStreams[index].deviceId
              ])) - 1
          }
        );
      })
    );

    return res.status(200).json({
      streams: getLiveStreams,
      page,
      pageSize,
      reachedEnd: getLiveStreams.length < pageSize
    });
  }

  const getLiveStreams = await db.sql<
    | s.users.SQL
    | s.online_users.SQL
    | s.users_topics.SQL
    | s.users_blocklist.SQL
    | s.users_followers.SQL,
    {
      deviceId: s.online_users.Selectable['deviceId'];
      streamTitle: s.online_users.Selectable['streamTitle'];
      avatar: s.users.Selectable['avatar'];
      username: s.users.Selectable['username'];
      thumbnail: s.online_users.Selectable['thumbnail'];
      isFollowing: boolean;
      count: number;
    }[]
  >`SELECT ${'online_users'}.${'deviceId'}, ${'online_users'}.${'streamTitle'}, ${'online_users'}.${'thumbnail'}, ${'users'}.${'avatar'}, ${'users'}.${'username'},
    EXISTS (SELECT 1 FROM ${'users_followers'} WHERE ${'userId'}=${'online_users'}.${'userId'} AND ${'followerId'}=${db.param(
    req.user.id
  )}) AS "isFollowing", count(*) OVER()::INTEGER
      FROM ${'users'}
      JOIN ${'online_users'} ON ${'users'}.${'id'} = ${'online_users'}.${'userId'}
      WHERE ${'online_users'}.${'isStreaming'} = ${db.param(true)} AND
      NOT EXISTS
      (
        SELECT 1 FROM ${'users_blocklist'} WHERE (${'userId'}=${'online_users'}.${'userId'} AND ${'blockedId'} = ${db.param(
    req.user.id
  )}) OR (${'userId'} = ${db.param(
    req.user.id
  )} AND ${'blockedId'}=${'online_users'}.${'userId'})
      ) ORDER BY ${'online_users'}.${'updatedAt'} DESC LIMIT ${db.param(
    pageSize
  )} OFFSET ${db.param((page - 1) * pageSize)}
  `.run(pgPool);

  const results = await Promise.all(
    getLiveStreams.map(async (user) =>
      redis.hmget(user.deviceId, 'upvote', 'downvote')
    )
  );
  await Promise.all(
    results.map(async (result, index) => {
      Object.assign(
        getLiveStreams[index],
        zipObject(['upvote', 'downvote'], result),
        {
          numViewers:
            (await countAllUsersInRooms(io, [getLiveStreams[index].deviceId])) -
            1
        }
      );
    })
  );

  const totalStreamsCount = getLiveStreams[0]?.count ?? 0;

  return res.status(200).json({
    streams: getLiveStreams,
    page,
    pageSize,
    totalPages: Math.ceil(totalStreamsCount / pageSize),
    total: totalStreamsCount,
    count: getLiveStreams.length
  });
});

export const getListOfViewers = asyncHandler(async (req, res, _next) => {
  const page = req.body.page || 1;
  const pageSize = req.body.pageSize || 10;
  const apiVersion = req.body.apiVersion || 1;
  const deviceId = req.body.deviceId;

  if (apiVersion === 2) {
    const viewers = await db.sql<
      s.users.SQL | s.online_users.SQL,
      {
        avatar: s.users.Selectable['avatar'];
        username: s.users.Selectable['username'];
        count: number;
      }[]
    >`SELECT ${'users'}.${'avatar'}, ${'users'}.${'username'}, ${'users'}.${'firstName'}, ${'users'}.${'lastName'}, count(*) OVER()::INTEGER
      FROM ${'users'}
      JOIN ${'online_users'} ON ${'users'}.${'id'} = ${'online_users'}.${'userId'}
      WHERE ${'online_users'}.${'activeConnection'} = ${db.param(deviceId)}
      ORDER BY ${'users'}.${'id'} LIMIT ${db.param(pageSize)} OFFSET ${db.param(
      (page - 1) * pageSize
    )}
      `.run(pgPool);

    const totalViewersCount = viewers[0]?.count ?? 0;

    return res.status(200).json({
      viewers,
      page,
      pageSize,
      total: totalViewersCount,
      reachedEnd: true
    });
  }
  const viewers = await db.sql<
    s.users.SQL | s.online_users.SQL,
    {
      avatar: s.users.Selectable['avatar'];
      username: s.users.Selectable['username'];
      count: number;
    }[]
  >`SELECT ${'users'}.${'avatar'}, ${'users'}.${'username'}, ${'users'}.${'firstName'}, ${'users'}.${'lastName'}, count(*) OVER()::INTEGER
      FROM ${'users'}
      JOIN ${'online_users'} ON ${'users'}.${'id'} = ${'online_users'}.${'userId'}
      WHERE ${'online_users'}.${'activeConnection'} = ${db.param(deviceId)}
      ORDER BY ${'users'}.${'id'} LIMIT ${db.param(pageSize)} OFFSET ${db.param(
    (page - 1) * pageSize
  )}
      `.run(pgPool);

  const totalViewersCount = viewers[0]?.count ?? 0;

  return res.status(200).json({
    viewers,
    page,
    pageSize,
    totalPages: Math.ceil(totalViewersCount / pageSize),
    total: totalViewersCount,
    count: viewers.length
  });
});
