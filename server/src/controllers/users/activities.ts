import asyncHandler from 'express-async-handler';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { pgPool, logger } from '../../utils';
import { orderBy } from 'lodash';

export const getActivities = asyncHandler(async (req, res, _next) => {
  const page: number = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;

  const activityData = await db.sql<
    s.users_activities.SQL,
    {
      type: s.users_activities_enum;
      array_agg: s.users_activities.Selectable['id'][];
    }[]
  >`
  SELECT ${'type'}, ARRAY_AGG(${'id'} ORDER BY ${'createdAt'} DESC)
  FROM
  (
    SELECT *
    FROM ${'users_activities'}
    WHERE ${'userId'}=${db.param(req.user.id)}
    ORDER BY ${'createdAt'} DESC
    LIMIT ${db.param(pageSize)}
    OFFSET ${db.param((page - 1) * pageSize)}
  ) s
  GROUP BY ${'type'}
  `.run(pgPool);

  const activityResult: any[] = [];
  const activityIds: string[][] = [];

  await Promise.all(
    activityData.map(async (activity) => {
      activityIds.push(activity.array_agg);
      switch (activity.type) {
        case 'new-follower': {
          const newFollowerData = await db.sql<
            s.users_activities_new_followers.SQL | s.users.SQL,
            (Pick<
              s.users_activities_new_followers.Selectable,
              'id' | 'viewed' | 'createdAt' | 'type'
            > &
              Pick<s.users.Selectable, 'username' | 'avatar'>)[]
          >`SELECT ${'users_activities_new_followers'}.${'id'}, ${'users_activities_new_followers'}.${'type'}, ${'users_activities_new_followers'}.${'viewed'}, ${'users_activities_new_followers'}.${'createdAt'}, ${'users'}.${'username'}, ${'users'}.${'avatar'}
          FROM ${'users_activities_new_followers'}
          JOIN ${'users'} ON ${'users_activities_new_followers'}.${'followerId'}=${'users'}.${'id'}
          WHERE ${'users_activities_new_followers'}.${'id'}=ANY(${db.param(
            activity.array_agg
          )})
          ORDER BY ${'users_activities_new_followers'}.${'createdAt'}`.run(
            pgPool
          );
          return activityResult.push(newFollowerData);
        }
        case 'post-comment': {
          const postCommentData = await db.sql<
            | s.users_activities_post_comments.SQL
            | s.users.SQL
            | s.users_posts.SQL
            | s.users_posts_comments.SQL
            | s.users_posts_media.SQL,
            (Pick<
              s.users_activities_post_comments.Selectable,
              'id' | 'viewed' | 'createdAt' | 'type'
            > &
              Pick<s.users.Selectable, 'username' | 'avatar'>)[]
          >`SELECT ${'users_activities_post_comments'}.${'id'}, ${'users_activities_post_comments'}.${'type'}, ${'users_activities_post_comments'}.${'viewed'}, ${'users_activities_post_comments'}.${'createdAt'}, ${'users'}.${'username'}, ${'users'}.${'avatar'}, ${'users_posts'}.${'id'} AS "postId", ${'users_posts_comments'}.${'comment'},
          (
            SELECT (row_to_json(${'users_posts_media'}))
            FROM ${'users_posts_media'}
            WHERE ${'users_posts_media'}.${'postId'}=${'users_activities_post_comments'}.${'postId'}
            AND ${'users_posts_media'}.${'position'}=${db.param(0)}
          ) AS "media"
          FROM ${'users_activities_post_comments'}
          JOIN ${'users'} ON ${'users_activities_post_comments'}.${'commenterId'}=${'users'}.${'id'}
          JOIN ${'users_posts'} ON ${'users_activities_post_comments'}.${'postId'}=${'users_posts'}.${'id'}
          JOIN ${'users_posts_comments'} ON ${'users_activities_post_comments'}.${'postCommentId'}=${'users_posts_comments'}.${'id'}
          WHERE ${'users_activities_post_comments'}.${'id'}=ANY(${db.param(
            activity.array_agg
          )})
          ORDER BY ${'users_activities_post_comments'}.${'createdAt'}`.run(
            pgPool
          );
          return activityResult.push(postCommentData);
        }
        case 'post-reaction': {
          const postReactionData = await db.sql<
            | s.users_activities_post_reactions.SQL
            | s.users.SQL
            | s.users_posts.SQL
            | s.users_posts_reactions.SQL
            | s.users_posts_media.SQL,
            (Pick<
              s.users_activities_post_reactions.Selectable,
              'id' | 'viewed' | 'createdAt' | 'type'
            > &
              Pick<s.users.Selectable, 'username' | 'avatar'>)[]
          >`SELECT ${'users_activities_post_reactions'}.${'id'}, ${'users_activities_post_reactions'}.${'type'}, ${'users_activities_post_reactions'}.${'viewed'}, ${'users_activities_post_reactions'}.${'createdAt'}, ${'users'}.${'username'}, ${'users'}.${'avatar'}, ${'users_posts'}.${'id'} AS "postId", ${'users_activities_post_reactions'}.${'reaction'},
          (
            SELECT (row_to_json(${'users_posts_media'}))
            FROM ${'users_posts_media'}
            WHERE ${'users_posts_media'}.${'postId'}=${'users_activities_post_reactions'}.${'postId'}
            AND ${'users_posts_media'}.${'position'}=${db.param(0)}
          ) AS "media"
          FROM ${'users_activities_post_reactions'}
          JOIN ${'users'} ON ${'users_activities_post_reactions'}.${'reacterId'}=${'users'}.${'id'}
          JOIN ${'users_posts'} ON ${'users_activities_post_reactions'}.${'postId'}=${'users_posts'}.${'id'}
          WHERE ${'users_activities_post_reactions'}.${'id'}=ANY(${db.param(
            activity.array_agg
          )})
          ORDER BY ${'users_activities_post_reactions'}.${'createdAt'}`.run(
            pgPool
          );
          return activityResult.push(postReactionData);
        }
      }
    })
  );

  const activityIdsFlatten = activityIds.flat();

  res.status(200).json({
    page,
    pageSize,
    reachedEnd: activityIdsFlatten.length < pageSize,
    activities: orderBy(
      activityResult.flat(),
      (activity) => new Date(activity.createdAt),
      'desc'
    )
  });

  try {
    if (activityIds.length > 0) {
      await db.sql<
        s.users_activities.SQL
      >`UPDATE ${'users_activities'} SET ${'viewed'} = ${db.param(
        true
      )} WHERE ${'id'} = ANY(${db.param(
        activityIdsFlatten
      )}) AND ${'viewed'} = ${db.param(false)}`.run(pgPool);
      await db.sql<
        s.users_activities_unread_count_total.SQL
      >`UPDATE ${'users_activities_unread_count_total'} SET ${'count'} = ${db.param(
        0
      )} WHERE ${'userId'}=${db.param(req.user.id)}`.run(pgPool);
    }
  } catch (err) {
    logger.error('getActivities() update viewed', err);
  }
});

export const deleteActivity = asyncHandler(async (req, res, _next) => {
  const { id } = req.body;
  await db.sql<s.users_activities.SQL>`
    DELETE FROM ${'users_activities'}
    WHERE ${'id'} = ${db.param(id)}`.run(pgPool);
  return res.sendStatus(200);
});

export const clearAllActivities = asyncHandler(async (req, res, _next) => {
  await db.sql<s.users_activities.SQL>`
    DELETE FROM ${'users_activities'}
    WHERE ${'userId'} = ${db.param(req.user.id)}`.run(pgPool);
  return res.sendStatus(200);
});
