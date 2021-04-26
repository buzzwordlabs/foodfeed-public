import asyncHandler from 'express-async-handler';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { pgPool, deleteFromS3Bucket } from '../../utils';

export const getPostsForUser = asyncHandler(async (req, res, _next) => {
  const page: number = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const username = req.query.username as string;

  const postData = await db.sql<
    | s.users.SQL
    | s.users_posts_reactions_total.SQL
    | s.users_posts_reactions.SQL
    | s.users_posts.SQL
    | s.users_posts_media.SQL,
    {
      username: s.users.Selectable['username'];
      avatar: s.users.Selectable['avatar'];
      id: s.users_posts.Selectable['id'];
      media: s.users_posts_media.Selectable[];
      reactions: s.users_posts_reactions_total.JSONSelectable[];
      edited: s.users_posts.Selectable['edited'];
      description: s.users_posts.Selectable['description'];
      createdAt: s.users_posts.Selectable['createdAt'];
    }[]
  >`
  SELECT ${'users'}.${'username'}, ${'users'}.${'avatar'}, ${'users_posts'}.${'id'}, ${'users_posts'}.${'description'},
  (
    SELECT json_agg(${'users_posts_media'}) FROM ${'users_posts_media'}
    WHERE ${'postId'}=${'users_posts'}.${'id'} ORDER BY ${'users_posts_media'}.${'position'}
  ) AS media,
  (
    SELECT json_agg(${'users_posts_reactions_total'})
    FROM ${'users_posts_reactions_total'}
    WHERE ${'users_posts_reactions_total'}.${'postId'}=${'users_posts'}.${'id'}
  ) AS "reactions",
  ${'users_posts'}.${'edited'}, ${'users_posts'}.${'createdAt'}
  FROM ${'users_posts'} JOIN ${'users'} ON ${'users'}.${'id'}=${'users_posts'}.${'userId'}
  WHERE ${'users'}.${'id'} IN (SELECT ${'id'} FROM ${'users'} WHERE ${'username'} = ${db.param(
    username
  )})
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
    | s.users_posts_media.SQL,
    {
      username: s.users.Selectable['username'];
      avatar: s.users.Selectable['avatar'];
      id: s.users_posts.Selectable['id'];
      media: s.users_posts_media.Selectable[];
      reactions: s.users_posts_reactions_total.Selectable[];
      edited: s.users_posts.Selectable['edited'];
      description: s.users_posts.Selectable['description'];
      createdAt: s.users_posts.Selectable['createdAt'];
    }[]
  >`
      SELECT ${'users'}.${'username'}, ${'users'}.${'avatar'}, ${'users_posts'}.${'id'}, ${'users_posts'}.${'description'},
      (
        SELECT json_agg(${'users_posts_media'}) FROM ${'users_posts_media'}
        WHERE ${'postId'}=${'users_posts'}.${'id'} ORDER BY ${'users_posts_media'}.${'position'}
      ) AS media,
      (
        SELECT json_agg(${'users_posts_reactions_total'})
        FROM ${'users_posts_reactions_total'}
        WHERE ${'users_posts_reactions_total'}.${'postId'}=${'users_posts'}.${'id'}
      ) as "reactions",
     ${'users_posts'}.${'edited'}, ${'users_posts'}.${'createdAt'}
      FROM ${'users_posts'} JOIN ${'users'} ON ${'users'}.${'id'}=${'users_posts'}.${'userId'}
      WHERE ${'users_posts'}.${'id'} = ${db.param(id)}
      `.run(pgPool);

  if (postData.length === 0) return res.sendStatus(400);

  return res.status(200).json(postData[0]);
});

export const banPost = asyncHandler(async (req, res, _next) => {
  const { id }: { id: s.users_posts.Selectable['id'] } = req.body;
  await db.sql<
    s.users_posts.SQL
  >`UPDATE ${'users_posts'} SET ${'banned'} = ${db.param(
    true
  )} WHERE ${'id'} = ${db.param(id)}`.run(pgPool);
  return res.sendStatus(200);
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
  >`DELETE FROM ${'users_posts'} WHERE ${'id'} = ${db.param(id)}`.run(pgPool);
  return res.sendStatus(200);
});
