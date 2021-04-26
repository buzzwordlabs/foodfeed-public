import asyncHandler from 'express-async-handler';
import { pgPool } from '../../utils';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';

export const searchPossibleConversations = asyncHandler(
  async (req, res, _next) => {
    const page: number = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const username = req.query.username as string;
    const users = await db.sql<
      s.users.SQL | s.users_followers.SQL,
      Pick<
        s.users.Selectable,
        'firstName' | 'lastName' | 'username' | 'avatar'
      >[]
    >`
    WITH relationships AS (
      SELECT ${'followerId'} AS ${'userId'} FROM ${'users_followers'} WHERE ${'userId'} = ${db.param(
      req.user.id
    )}
      UNION
      SELECT ${'userId'} FROM ${'users_followers'} WHERE ${'followerId'} = ${db.param(
      req.user.id
    )}
    )
    SELECT ${'firstName'}, ${'lastName'}, ${'username'}, ${'avatar'}
    FROM relationships
    JOIN ${'users'} ON relationships.${'userId'}=${'users'}.${'id'}
    WHERE (${'users'}.${'username'} ILIKE ${db.param(
      `%${username}%`
    )} OR ${'users'}.${'fullName'} ILIKE ${db.param(`%${username}%`)})
    AND ${'users'}.${'id'} <> ${db.param(req.user.id)}
    ORDER BY ${'users'}.${'fullName'} LIMIT ${db.param(
      pageSize
    )} OFFSET ${db.param((page - 1) * pageSize)}
    `.run(pgPool);
    return res.status(200).json({
      page,
      pageSize,
      reachedEnd: users.length < pageSize,
      users
    });
  }
);

export const getReactionsMessages = asyncHandler(async (req, res, _next) => {
  const id = req.query.id as string;
  const page: number = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const reaction = req.query.reaction;
  const users = await db.sql<
    s.users.SQL | s.users_conversations_participants_messages_reactions.SQL,
    {
      username: s.users.Selectable['username'];
      avatar: s.users.Selectable['avatar'];
      firstName: s.users.Selectable['firstName'];
      lastName: s.users.Selectable['lastName'];
    }[]
  >`
    SELECT ${'users'}.${'username'}, ${'users'}.${'avatar'}, ${'users'}.${'firstName'}, ${'users'}.${'lastName'}
    FROM ${'users'} JOIN ${'users_conversations_participants_messages_reactions'} ON ${'users'}.${'id'}=${'users_conversations_participants_messages_reactions'}.${'userId'}
    WHERE ${'users_conversations_participants_messages_reactions'}.${'messageId'} = ${db.param(
    id
  )} AND ${'users_conversations_participants_messages_reactions'}.${'reaction'} = ${db.param(
    reaction
  )}
    ORDER BY ${'users_conversations_participants_messages_reactions'}.${'createdAt'} DESC LIMIT ${db.param(
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

export const deleteConversation = asyncHandler(async (req, res, _next) => {
  const { id }: { id: s.users_conversations.Selectable['id'] } = req.body;

  await db.sql<
    s.users_conversations_participants.SQL
  >`DELETE FROM ${'users_conversations_participants'}
    WHERE ${'conversationId'} = ${db.param(id)} AND ${'userId'} = ${db.param(
    req.user.id
  )}`.run(pgPool);
  return res.sendStatus(200);
});
