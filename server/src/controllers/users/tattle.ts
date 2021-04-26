import asyncHandler from 'express-async-handler';
import { redis, pgPool } from '../../utils';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
type ReportedUsers =
  | ReportCallMetadata
  | ReportStreamMetadata
  | ReportPostMetadata;
type ReportCallMetadata = { callId: string };
type ReportStreamMetadata = { deviceId: string };
type ReportPostMetadata = { postId: string };
// TODO BACKCOMPAT - remove default case
export const reportUser = asyncHandler(async (req, res, _next) => {
  const {
    username,
    reason,
    type,
    metadata
  }: {
    username: s.users.Selectable['username'];
    reason: string;
    type: s.users_reported_enum;
    metadata: ReportedUsers;
  } = req.body;
  const remoteUser = await db.sql<
    s.users.SQL,
    Pick<s.users.Selectable, 'id'>[]
  >`SELECT ${'id'} FROM ${'users'} WHERE ${'username'} = ${db.param(
    username
  )}`.run(pgPool);

  if (remoteUser.length > 0) {
    switch (type) {
      case 'post': {
        // metadata is object with postId
        const reportedUsersData: s.reported_users.Insertable = {
          userId: remoteUser[0].id,
          reason: reason,
          reportedBy: req.user.id,
          type,
          metadata
        };
        await db.sql<s.reported_users.SQL>`
        INSERT INTO ${'reported_users'} (${db.cols(reportedUsersData)})
        VALUES (${db.vals(reportedUsersData)})`.run(pgPool);
        break;
      }
      case 'call': {
        // metadata is object with callId
        const reportedUsersData: s.reported_users.Insertable = {
          userId: remoteUser[0].id,
          reason: reason,
          reportedBy: req.user.id,
          type,
          metadata
        };
        await db.sql<s.reported_users.SQL>`
        INSERT INTO ${'reported_users'} (${db.cols(reportedUsersData)})
        VALUES (${db.vals(reportedUsersData)})`.run(pgPool);
        break;
      }
      case 'viewer-reports-streamer':
      case 'streamer-reports-viewer': {
        const streamId = await redis.hget(
          (metadata as ReportStreamMetadata).deviceId,
          'streamHistory'
        );
        const reportedUsersData: s.reported_users.Insertable = {
          userId: remoteUser[0].id,
          reason: reason,
          reportedBy: req.user.id,
          type,
          // @ts-ignore
          metadata: {
            streamId
          }
        };
        await db.sql<s.reported_users.SQL>`
        INSERT INTO ${'reported_users'} (${db.cols(reportedUsersData)})
        VALUES (${db.vals(reportedUsersData)})`.run(pgPool);
        break;
      }
      case 'user': {
        const reportedUsersData: s.reported_users.Insertable = {
          userId: remoteUser[0].id,
          reason: reason,
          reportedBy: req.user.id,
          type,
          metadata
        };
        await db.sql<s.reported_users.SQL>`
        INSERT INTO ${'reported_users'} (${db.cols(reportedUsersData)})
        VALUES (${db.vals(reportedUsersData)})`.run(pgPool);
        break;
      }
      case 'post-comment': {
        // metadata is object with postId and commentId
        const reportedUsersData: s.reported_users.Insertable = {
          userId: remoteUser[0].id,
          reason: reason,
          reportedBy: req.user.id,
          type,
          metadata
        };
        await db.sql<s.reported_users.SQL>`
        INSERT INTO ${'reported_users'} (${db.cols(reportedUsersData)})
        VALUES (${db.vals(reportedUsersData)})`.run(pgPool);
        break;
      }
      default: {
        const reportedUsersData: s.reported_users.Insertable = {
          userId: remoteUser[0].id,
          reason: reason,
          reportedBy: req.user.id,
          type,
          metadata
        };
        await db.sql<s.reported_users.SQL>`
        INSERT INTO ${'reported_users'} (${db.cols(reportedUsersData)})
        VALUES (${db.vals(reportedUsersData)})`.run(pgPool);
        break;
      }
    }
    await db.sql<
      s.users_blocklist.SQL
    >`INSERT INTO ${'users_blocklist'} (${'userId'}, ${'blockedId'}) VALUES (${db.param(
      req.user.id
    )}, ${db.param(
      remoteUser[0].id
    )}) ON CONFLICT ON CONSTRAINT users_blocklist_pkey DO NOTHING`.run(pgPool);
    return res.sendStatus(200);
  }
  return res.sendStatus(400);
});

export const addToBlocklist = asyncHandler(async (req, res, _next) => {
  const { username }: { username: s.users.Selectable['username'] } = req.body;
  const blockedUser = await db.sql<
    s.users.SQL,
    Pick<s.users.Selectable, 'id'>[]
  >`SELECT ${'id'} FROM ${'users'} WHERE ${'username'} = ${db.param(
    username
  )}`.run(pgPool);
  if (blockedUser.length === 0 || blockedUser[0].id === req.user.id)
    return res.sendStatus(400);
  await db.sql<
    s.users_blocklist.SQL
  >`INSERT INTO ${'users_blocklist'} (${'userId'}, ${'blockedId'}) VALUES (${db.param(
    req.user.id
  )}, ${db.param(
    blockedUser[0].id
  )}) ON CONFLICT ON CONSTRAINT users_blocklist_pkey DO NOTHING`.run(pgPool);
  return res.sendStatus(200);
});

export const removeFromBlocklist = asyncHandler(async (req, res, _next) => {
  const { username }: { username: s.users.Selectable['username'] } = req.body;
  const blockedUser = await db.sql<
    s.users.SQL,
    Pick<s.users.Selectable, 'id'>[]
  >`SELECT ${'id'} FROM ${'users'} WHERE ${'username'} = ${db.param(
    username
  )}`.run(pgPool);
  if (blockedUser.length === 0 || blockedUser[0].id === req.user.id)
    return res.sendStatus(400);
  await db.sql<
    s.users_blocklist.SQL
  >`DELETE FROM ${'users_blocklist'} WHERE ${'userId'} = ${db.param(
    req.user.id
  )} AND ${'blockedId'} = ${db.param(blockedUser[0].id)}`.run(pgPool);
  return res.sendStatus(200);
});
