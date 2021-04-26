import asyncHandler from 'express-async-handler';
import {
  POSTGRES_DUP_ENTRY_ERROR_CODE,
  deleteFromS3Bucket,
  getMimeCategory,
  pgPool,
  redis,
  logger,
  amplitude,
  emitUnreadActivityCount
} from '../../utils';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { UserRedisData, AMPLITUDE_POST_EVENTS } from '../../types';
import { extractNotificationTokensFromUsersDevices } from '../../utils/pushNotifications/utils';
import { newPostInteractionNotification } from '../../utils/pushNotifications';

export const getPosts = asyncHandler(async (req, res, _next) => {
  const page: number = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;

  const postData = await db.sql<
    | s.users.SQL
    | s.users_posts_reactions_total.SQL
    | s.users_posts_reactions.SQL
    | s.users_posts.SQL
    | s.users_posts_media.SQL
    | s.users_followers.SQL
    | s.users_blocklist.SQL
    | s.users_posts_comments.SQL
    | s.users_posts_comments_total.SQL,
    {
      username: s.users.Selectable['username'];
      avatar: s.users.Selectable['avatar'];
      id: s.users_posts.Selectable['id'];
      media: Omit<s.users_posts_media.Selectable, 'id'>[];
      reactions: (s.users_posts_reactions_total.JSONSelectable & {
        reacted: boolean;
      })[];
      isFollowing: boolean;
      edited: s.users_posts.Selectable['edited'];
      description: s.users_posts.Selectable['description'];
      createdAt: s.users_posts.Selectable['createdAt'];
      commentCount: s.users_posts_comments_total.Selectable['count'];
      comments: (Omit<s.users_posts_comments.Selectable, 'userId'> &
        Pick<s.users.Selectable, 'username'> &
        Pick<s.users.Selectable, 'avatar'>)[];
    }[]
  >`
  SELECT ${'users'}.${'username'}, ${'users'}.${'avatar'}, ${'users_posts'}.${'id'}, ${'users_posts'}.${'description'}, ${'users_posts'}.${'edited'}, ${'users_posts'}.${'createdAt'},
  (
    SELECT json_agg(to_jsonb(${'users_posts_media'}) - 'id' ORDER BY ${'position'}) FROM ${'users_posts_media'}
    WHERE ${'postId'}=${'users_posts'}.${'id'}
  ) AS media,
  (
    SELECT json_agg(
      to_jsonb(${'users_posts_reactions_total'}) ||
      jsonb_build_object('reacted',
        EXISTS
        (
          SELECT 1 FROM ${'users_posts_reactions'}
          WHERE ${'users_posts_reactions'}.${'postId'}=${'users_posts'}.${'id'}
          AND ${'users_posts_reactions'}.${'userId'}=${db.param(req.user.id)}
          AND ${'users_posts_reactions'}.${'reaction'}=${'users_posts_reactions_total'}.${'reaction'}
          AND ${'users_posts_reactions'}.${'deleted'}=${db.param(false)}
        )
      )
    )
    FROM ${'users_posts_reactions_total'}
    WHERE ${'users_posts_reactions_total'}.${'postId'}=${'users_posts'}.${'id'}
  ) AS "reactions",
  EXISTS (SELECT 1 FROM ${'users_followers'} WHERE ${'userId'}=${'users_posts'}.${'userId'} AND ${'followerId'} = ${db.param(
    req.user.id
  )}) AS "isFollowing",
  (
    SELECT ${'count'} FROM ${'users_posts_comments_total'}
    WHERE ${'users_posts_comments_total'}.${'postId'}=${'users_posts'}.${'id'}
  ) AS "commentCount",
  COALESCE(
    (
      SELECT
      json_agg("commentList" ORDER BY ${'createdAt'})
      FROM (
        SELECT ${'users'}.${'username'}, ${'users'}.${'avatar'}, ${'users_posts_comments'}.${'id'}, ${'users_posts_comments'}.${'postId'}, ${'users_posts_comments'}.${'comment'}, ${'users_posts_comments'}.${'createdAt'}
        FROM ${'users_posts_comments'}
        JOIN ${'users'} ON ${'users_posts_comments'}.${'userId'}=${'users'}.${'id'}
        WHERE ${'users_posts_comments'}.${'postId'}=${'users_posts'}.${'id'}
        ORDER BY ${'users_posts_comments'}.${'createdAt'}
        LIMIT 3
      ) AS "commentList"
    ), '[]'::json) AS "comments"
  FROM ${'users_posts'} JOIN ${'users'} ON ${'users'}.${'id'}=${'users_posts'}.${'userId'} WHERE
  NOT EXISTS
    (SELECT 1 FROM ${'users_blocklist'} WHERE (${'userId'}=${'users'}.${'id'} AND ${'blockedId'} = ${db.param(
    req.user.id
  )}) OR (${'userId'} = ${db.param(
    req.user.id
  )} AND ${'blockedId'}=${'users'}.${'id'})) AND ${'users'}.${'banned'} = ${db.param(
    false
  )} AND ${'users_posts'}.${'banned'} = ${db.param(false)}
  ORDER BY ${'users_posts'}.${'createdAt'} DESC LIMIT ${db.param(
    pageSize
  )} OFFSET ${db.param((page - 1) * pageSize)}
    `.run(pgPool);

  return res.status(200).json({
    page,
    pageSize,
    reachedEnd: postData.length < pageSize,
    posts: postData
  });
});

export const getPost = asyncHandler(async (req, res, _next) => {
  const id = req.query.id as string;
  const postData = await db.sql<
    | s.users.SQL
    | s.users_posts.SQL
    | s.users_posts_reactions_total.SQL
    | s.users_posts_reactions.SQL
    | s.users_posts_media.SQL
    | s.users_followers.SQL
    | s.users_posts_comments.SQL
    | s.users_posts_comments_total.SQL
    | s.users_blocklist.SQL,
    {
      username: s.users.Selectable['username'];
      avatar: s.users.Selectable['avatar'];
      id: s.users_posts.Selectable['id'];
      media: Omit<s.users_posts_media.Selectable, 'id'>[];
      reactions: (s.users_posts_reactions_total.JSONSelectable & {
        reacted: boolean;
      })[];
      edited: s.users_posts.Selectable['edited'];
      isFollowing: boolean;
      description: s.users_posts.Selectable['description'];
      createdAt: s.users_posts.Selectable['createdAt'];
      commentCount: s.users_posts_comments_total.Selectable['count'];
      comments: (Omit<s.users_posts_comments.Selectable, 'userId'> &
        Pick<s.users.Selectable, 'username'> &
        Pick<s.users.Selectable, 'avatar'>)[];
    }[]
  >`
    SELECT ${'users'}.${'username'}, ${'users'}.${'avatar'}, ${'users_posts'}.${'id'}, ${'users_posts'}.${'description'}, ${'users_posts'}.${'edited'}, ${'users_posts'}.${'createdAt'},
    (
      SELECT json_agg(to_jsonb(${'users_posts_media'}) - 'id' ORDER BY ${'position'}) FROM ${'users_posts_media'}
      WHERE ${'postId'}=${'users_posts'}.${'id'}
    ) AS media,
    (
      SELECT json_agg(
        to_jsonb(${'users_posts_reactions_total'}) ||
        jsonb_build_object('reacted',
          EXISTS
          (
            SELECT 1 FROM ${'users_posts_reactions'}
            WHERE ${'users_posts_reactions'}.${'postId'}=${'users_posts'}.${'id'}
            AND ${'users_posts_reactions'}.${'userId'}=${db.param(req.user.id)}
            AND ${'users_posts_reactions'}.${'reaction'}=${'users_posts_reactions_total'}.${'reaction'}
            AND ${'users_posts_reactions'}.${'deleted'}=${db.param(false)}
          )
        )
      )
      FROM ${'users_posts_reactions_total'}
      WHERE ${'users_posts_reactions_total'}.${'postId'}=${'users_posts'}.${'id'}
    ) AS "reactions",
  EXISTS (SELECT 1 FROM ${'users_followers'} WHERE ${'userId'}=${'users_posts'}.${'userId'} AND ${'followerId'} = ${db.param(
    req.user.id
  )}) AS "isFollowing",
  (
    SELECT ${'count'} FROM ${'users_posts_comments_total'}
    WHERE ${'users_posts_comments_total'}.${'postId'}=${'users_posts'}.${'id'}
  ) AS "commentCount",
  COALESCE(
    (
      SELECT
      json_agg("commentList" ORDER BY ${'createdAt'})
      FROM (
        SELECT ${'users'}.${'username'}, ${'users'}.${'avatar'}, ${'users_posts_comments'}.${'id'}, ${'users_posts_comments'}.${'postId'}, ${'users_posts_comments'}.${'comment'}, ${'users_posts_comments'}.${'createdAt'}
        FROM ${'users_posts_comments'}
        JOIN ${'users'} ON ${'users_posts_comments'}.${'userId'}=${'users'}.${'id'}
        WHERE ${'users_posts_comments'}.${'postId'}=${'users_posts'}.${'id'}
        ORDER BY ${'users_posts_comments'}.${'createdAt'}
        LIMIT 10
      ) AS "commentList"
    ), '[]'::json) AS "comments"
    FROM ${'users_posts'} JOIN ${'users'} ON ${'users'}.${'id'}=${'users_posts'}.${'userId'}
    WHERE ${'users_posts'}.${'id'} = ${db.param(id)}
    AND
    NOT EXISTS
    (SELECT 1 FROM ${'users_blocklist'} WHERE (${'userId'}=${'users'}.${'id'} AND ${'blockedId'} = ${db.param(
    req.user.id
  )}) OR (${'userId'} = ${db.param(
    req.user.id
  )} AND ${'blockedId'}=${'users'}.${'id'})) AND ${'users'}.${'banned'} = ${db.param(
    false
  )} AND ${'users_posts'}.${'banned'} = ${db.param(false)}
    `.run(pgPool);

  if (postData.length === 0) return res.sendStatus(400);

  return res.status(200).json(postData[0]);
});

export const createPost = asyncHandler(async (req, res, _next) => {
  if (req.files.length === 0) return res.sendStatus(400);
  const mediaSource: 'upload_from_camera_roll' | 'upload_from_image_take' =
    req.body.mediaSource || '';
  const {
    description
  }: { description: s.users_posts.Selectable['description'] } = req.body;
  const post = await db.sql<
    s.users_posts.SQL,
    Pick<s.users_posts.Selectable, 'id'>[]
  >`INSERT INTO ${'users_posts'} (${'userId'}, ${'description'}) VALUES (${db.param(
    req.user.id
  )}, ${db.param(description ?? '')}) RETURNING id`.run(pgPool);
  const media: s.users_posts_media.Insertable[] = (req.files as Express.MulterS3.File[]).map(
    (file) => ({
      postId: post[0].id,
      type: getMimeCategory(file.mimetype) as s.users_posts_media_enum,
      uri: file.location,
      position: Number(file.location[file.location.length - 1])
    })
  );
  await db.insert('users_posts_media', media).run(pgPool);
  res.sendStatus(200);
  try {
    await amplitude.track({
      event_type: AMPLITUDE_POST_EVENTS.CREATE_POST,
      user_id: req.user.id,
      event_properties: { postId: post[0].id, mediaSource }
    });
  } catch (err) {
    logger.error('amplitude createPost()', err);
  }
});

export const editPost = asyncHandler(async (req, res, _next) => {
  const {
    id,
    description
  }: {
    id: s.users_posts.Selectable['id'];
    description: s.users_posts.Selectable['description'];
  } = req.body;
  await db.sql<
    s.users_posts.SQL
  >`UPDATE ${'users_posts'} SET ${'description'} = ${db.param(
    description ?? ''
  )}, ${'edited'} = ${db.param(true)} WHERE ${'userId'} = ${db.param(
    req.user.id
  )} AND ${'id'} = ${db.param(id)}`.run(pgPool);
  res.sendStatus(200);
  try {
    await amplitude.track({
      event_type: AMPLITUDE_POST_EVENTS.EDIT_POST,
      user_id: req.user.id,
      event_properties: { postId: id }
    });
  } catch (err) {
    logger.error('amplitude editPost()', err);
  }
});

export const deletePost = asyncHandler(async (req, res, _next) => {
  const { id }: { id: s.users_posts.Selectable['id'] } = req.body;
  const media = await db.sql<
    s.users_posts_media.SQL,
    Pick<s.users_posts_media.Selectable, 'uri'>[]
  >`SELECT ${'uri'} FROM ${'users_posts_media'} WHERE ${'postId'} = ${db.param(
    id
  )}`.run(pgPool);
  if (media.length === 0) return res.sendStatus(400);
  await Promise.all(media.map(async (item) => deleteFromS3Bucket(item.uri)));
  await db.sql<
    s.users_posts.SQL
  >`DELETE FROM ${'users_posts'} WHERE ${'id'} = ${db.param(
    id
  )} AND ${'userId'} = ${db.param(req.user.id)}`.run(pgPool);
  res.sendStatus(200);
  try {
    await amplitude.track({
      event_type: AMPLITUDE_POST_EVENTS.DELETE_POST,
      user_id: req.user.id,
      event_properties: { postId: id }
    });
  } catch (err) {
    logger.error('amplitude deletePost()', err);
  }
});

export const reactToPost = asyncHandler(async (req, res, _next) => {
  const {
    id,
    reaction
  }: {
    id: s.users_posts.Selectable['id'];
    reaction: s.users_posts_reactions.Selectable['reaction'];
  } = req.body;

  const alreadyReacted = await db.sql<
    s.users_posts_reactions.SQL,
    { exists: boolean }[]
  >`SELECT EXISTS (SELECT 1 FROM ${'users_posts_reactions'} WHERE ${'userId'} = ${db.param(
    req.user.id
  )} AND ${'postId'} = ${db.param(id)})`.run(pgPool);

  const results = await db.sql<
    s.users_posts_reactions.SQL,
    {
      result: {
        deleted: s.users_posts_reactions.Selectable['deleted'];
        action: 'INSERT' | 'UPDATE';
      };
    }[]
  >`INSERT INTO ${'users_posts_reactions'}(${'userId'}, ${'postId'}, ${'reaction'})
    VALUES (${db.param(req.user.id)}, ${db.param(id)}, ${db.param(reaction)})
    ON CONFLICT ON CONSTRAINT users_posts_reactions_pkey
    DO
    UPDATE SET
    ${'reaction'} = EXCLUDED.${'reaction'},
    ${'deleted'} = NOT ${'users_posts_reactions'}.${'deleted'}
    RETURNING jsonb_build_object('deleted', ${'users_posts_reactions'}.${'deleted'}, 'action', (CASE xmax
      WHEN 0 THEN
        'INSERT'
      ELSE
        'UPDATE'
      END)) AS result`.run(pgPool);
  res.sendStatus(200);

  if (results[0].result.action === 'INSERT' && !alreadyReacted[0].exists) {
    try {
      const usernameStr: keyof Pick<UserRedisData, 'username'> = 'username';
      const username = await redis.hget(req.user.id, usernameStr);
      const userDevices = await db.sql<
        s.users_devices.SQL | s.users_posts.SQL,
        (Pick<s.users_devices.Selectable, 'notificationToken' | 'platform'> &
          Pick<s.users_posts.Selectable, 'userId'>)[]
      >`SELECT ${'users_posts'}.${'userId'}, ${'users_devices'}.${'notificationToken'}, ${'users_devices'}.${'platform'}
    FROM ${'users_posts'}
    LEFT JOIN ${'users_devices'} ON ${'users_posts'}.${'userId'} = ${'users_devices'}.${'userId'} AND ${'users_devices'}.${'notificationToken'} IS NOT NULL
    WHERE ${'users_posts'}.${'id'}=${db.param(
        id
      )} AND ${'users_posts'}.${'userId'} <> ${db.param(req.user.id)}`.run(
        pgPool
      );
      if (userDevices.length > 0) {
        const notificationTokens = extractNotificationTokensFromUsersDevices(
          userDevices
        );
        if (notificationTokens) {
          await newPostInteractionNotification({
            notificationTokens,
            customData: {
              interaction: 'reacted',
              username: username!,
              postId: id
            }
          });
        }
        await emitUnreadActivityCount(userDevices[0].userId);
      }
    } catch (err) {
      logger.error('reactToPost() sendNotification', err);
    }
  }
  try {
    if (results[0].result.action === 'INSERT') {
      await amplitude.track({
        event_type: AMPLITUDE_POST_EVENTS.REACT_POST,
        user_id: req.user.id,
        event_properties: { postId: id, reaction }
      });
    } else if (
      results[0].result.action === 'UPDATE' &&
      results[0].result.deleted === false
    ) {
      await amplitude.track({
        event_type: AMPLITUDE_POST_EVENTS.REREACT_POST,
        user_id: req.user.id,
        event_properties: { postId: id, reaction }
      });
    } else {
      try {
        await amplitude.track({
          event_type: AMPLITUDE_POST_EVENTS.UNREACT_POST,
          user_id: req.user.id,
          event_properties: { postId: id }
        });
      } catch (err) {
        logger.error('amplitude unreactPost()', err);
      }
    }
  } catch (err) {
    logger.error('amplitude reactPost()', err);
  }
});

export const getReactionsUsers = asyncHandler(async (req, res, _next) => {
  const id = req.query.id as string;
  const page: number = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const reaction = req.query.reaction;
  const users = await db.sql<
    s.users.SQL | s.users_posts_reactions.SQL,
    {
      username: s.users.Selectable['username'];
      avatar: s.users.Selectable['avatar'];
      firstName: s.users.Selectable['firstName'];
      lastName: s.users.Selectable['lastName'];
    }[]
  >`
    SELECT ${'users'}.${'username'}, ${'users'}.${'avatar'}, ${'users'}.${'firstName'}, ${'users'}.${'lastName'}
    FROM ${'users'} JOIN ${'users_posts_reactions'} ON ${'users'}.${'id'}=${'users_posts_reactions'}.${'userId'}
    WHERE ${'users_posts_reactions'}.${'postId'} = ${db.param(
    id
  )} AND ${'users_posts_reactions'}.${'reaction'} = ${db.param(
    reaction
  )} AND ${'users_posts_reactions'}.${'deleted'} = ${db.param(false)}
    ORDER BY ${'users_posts_reactions'}.${'createdAt'} DESC LIMIT ${db.param(
    pageSize
  )} OFFSET ${db.param((page - 1) * pageSize)}
    `.run(pgPool);
  return res.status(200).json({
    page,
    pageSize,
    users,
    reachedEnd: users.length < pageSize
  });
});

export const getComments = asyncHandler(async (req, res, _next) => {
  const id = req.query.id as string;
  const page: number = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const comments = await db.sql<
    s.users.SQL | s.users_posts_comments.SQL,
    {
      username: s.users.Selectable['username'];
      avatar: s.users.Selectable['avatar'];
      comment: Omit<s.users_posts_comments.Selectable, 'userId'>;
    }[]
  >`
    SELECT ${'users'}.${'username'}, ${'users'}.${'avatar'}, ${'users_posts_comments'}.${'id'}, ${'users_posts_comments'}.${'postId'}, ${'users_posts_comments'}.${'comment'}, ${'users_posts_comments'}.${'createdAt'}
    FROM ${'users'} JOIN ${'users_posts_comments'} ON ${'users'}.${'id'}=${'users_posts_comments'}.${'userId'}
    WHERE ${'users_posts_comments'}.${'postId'} = ${db.param(id)}
    ORDER BY ${'users_posts_comments'}.${'createdAt'} LIMIT ${db.param(
    pageSize
  )} OFFSET ${db.param((page - 1) * pageSize)}
    `.run(pgPool);
  return res.status(200).json({
    page,
    pageSize,
    comments,
    reachedEnd: comments.length < pageSize
  });
});

export const makeComment = asyncHandler(async (req, res, _next) => {
  const {
    id,
    comment
  }: {
    id: s.users_posts.Selectable['id'];
    comment: s.users_posts_comments.Selectable['comment'];
  } = req.body;

  const alreadyCommented = await db.sql<
    s.users_posts_comments.SQL,
    { exists: boolean }[]
  >`SELECT EXISTS (SELECT 1 FROM ${'users_posts_comments'} WHERE ${'userId'} = ${db.param(
    req.user.id
  )} AND ${'postId'} = ${db.param(id)})`.run(pgPool);

  const newComment = await db.sql<
    s.users_posts_comments.SQL,
    {
      id: s.users_posts_comments.Selectable['id'];
      postId: s.users_posts_comments.Selectable['postId'];
      comment: s.users_posts_comments.Selectable['comment'];
      createdAt: s.users_posts_comments.Selectable['createdAt'];
    }[]
  >`INSERT INTO ${'users_posts_comments'} (${'postId'}, ${'userId'}, ${'comment'}) VALUES (${db.param(
    id
  )}, ${db.param(req.user.id)}, ${db.param(comment)})
    RETURNING ${'users_posts_comments'}.${'id'}, ${'users_posts_comments'}.${'postId'},
      ${'users_posts_comments'}.${'comment'}, ${'users_posts_comments'}.${'createdAt'}
    `.run(pgPool);
  res.status(200).json({ comment: newComment[0] });

  if (!alreadyCommented[0].exists) {
    try {
      const usernameStr: keyof Pick<UserRedisData, 'username'> = 'username';
      const username = await redis.hget(req.user.id, usernameStr);
      const userDevices = await db.sql<
        s.users_devices.SQL | s.users_posts.SQL,
        (Pick<s.users_devices.Selectable, 'notificationToken' | 'platform'> &
          Pick<s.users_posts.Selectable, 'userId'>)[]
      >`SELECT ${'users_devices'}.${'notificationToken'}, ${'users_devices'}.${'platform'}
    FROM ${'users_posts'}
    LEFT JOIN ${'users_devices'} ON ${'users_posts'}.${'userId'} = ${'users_devices'}.${'userId'} AND ${'users_devices'}.${'notificationToken'} IS NOT NULL
    WHERE ${'users_posts'}.${'id'}=${db.param(
        id
      )} AND ${'users_posts'}.${'userId'} <> ${db.param(req.user.id)}`.run(
        pgPool
      );
      if (userDevices.length > 0) {
        const notificationTokens = extractNotificationTokensFromUsersDevices(
          userDevices
        );
        if (notificationTokens) {
          await newPostInteractionNotification({
            notificationTokens,
            customData: {
              interaction: 'commented',
              username: username!,
              postId: id
            }
          });
        }
        await emitUnreadActivityCount(userDevices[0].userId);
      }
    } catch (err) {
      logger.error('makeComment() sendNotification', err);
    }
  }
  try {
    await amplitude.track({
      event_type: AMPLITUDE_POST_EVENTS.MAKE_COMMENT,
      user_id: req.user.id,
      event_properties: { postId: id }
    });
  } catch (err) {
    logger.error('amplitude makeComment()', err);
  }
});

export const editComment = asyncHandler(async (req, res, _next) => {
  const {
    postId,
    id,
    comment
  }: {
    postId: s.users_posts_comments.Selectable['postId'];
    id: s.users_posts_comments.Selectable['id'];
    comment: s.users_posts_comments.Selectable['comment'];
  } = req.body;
  await db.sql<
    s.users_posts_comments.SQL
  >`UPDATE ${'users_posts_comments'} SET ${'comment'}=${db.param(
    comment
  )} WHERE ${'id'}=${db.param(id)} AND ${'userId'}=${db.param(
    req.user.id
  )}`.run(pgPool);
  res.sendStatus(200);
  try {
    await amplitude.track({
      event_type: AMPLITUDE_POST_EVENTS.EDIT_COMMENT,
      user_id: req.user.id,
      event_properties: { postId: postId, commentId: id }
    });
  } catch (err) {
    logger.error('amplitude editComment()', err);
  }
});

export const deleteComment = asyncHandler(async (req, res, _next) => {
  const {
    id
  }: {
    id: s.users_posts_comments.Selectable['id'];
  } = req.body;
  await db.sql<
    s.users_posts_comments.SQL
  >`DELETE FROM ${'users_posts_comments'} WHERE ${'id'}=${db.param(
    id
  )} WHERE ${'id'}=${db.param(id)} AND ${'userId'}=${db.param(
    req.user.id
  )}`.run(pgPool);
  res.sendStatus(200);
  try {
    await amplitude.track({
      event_type: AMPLITUDE_POST_EVENTS.DELETE_COMMENT,
      user_id: req.user.id,
      event_properties: { postId: id }
    });
  } catch (err) {
    logger.error('amplitude deleteComment()', err);
  }
});
