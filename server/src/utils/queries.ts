import * as db from '../zapatos/src';
import * as s from '../zapatos/schema';
import { pgPool } from './pgPool';
import {
  ClientActivityEvents,
  ClientConversationEvents
} from '../sockets/constants';
import { io } from '../server';
import { redis } from '.';

export const getFollowingCount = async (userId: s.users.Selectable['id']) => {
  const row = await db.sql<
    s.users_followers.SQL,
    { count: number }[]
  >`SELECT COUNT(*)::INTEGER FROM ${'users_followers'} WHERE ${'followerId'} = ${db.param(
    userId
  )}`.run(pgPool);
  return row[0].count;
};

export const getFollowersCount = async (userId: s.users.Selectable['id']) => {
  const row = await db.sql<
    s.users_followers.SQL,
    { count: number }[]
  >`SELECT COUNT(*)::INTEGER FROM ${'users_followers'} WHERE ${'userId'} = ${db.param(
    userId
  )}`.run(pgPool);
  return row[0].count;
};

export const getUnreadMessagesCount = async (
  userId: s.users.Selectable['id']
) => {
  const unread = await db.sql<
    s.users_conversations_messages_unread_count_total.SQL,
    Pick<
      s.users_conversations_messages_unread_count_total.Selectable,
      'count'
    >[]
  >`SELECT ${'count'} FROM ${'users_conversations_messages_unread_count_total'} WHERE ${'userId'} = ${db.param(
    userId
  )}`.run(pgPool);
  return Number(unread[0].count);
};

export const getUnreadActivitiesCount = async (
  userId: s.users.Selectable['id']
) => {
  const unread = await db.sql<
    s.users_activities_unread_count_total.SQL,
    Pick<s.users_activities_unread_count_total.Selectable, 'count'>[]
  >`SELECT ${'count'} FROM ${'users_activities_unread_count_total'} WHERE ${'userId'} = ${db.param(
    userId
  )}`.run(pgPool);
  return Number(unread[0].count);
};

export const getUserSocketIds = async (userId: s.users.Selectable['id']) => {
  const sessions = await redis.hgetall(`${userId}-sessions`);
  return Object.values(sessions);
};

export const emitUnreadActivityCount = async (
  userId: s.users.Selectable['id']
) => {
  const socketIds = await getUserSocketIds(userId);
  if (socketIds.length > 0) {
    const activityCount = await getUnreadActivitiesCount(userId);
    socketIds.map((socketId) =>
      io.to(socketId).emit(ClientActivityEvents.UNREAD_ACTIVITY_COUNT, {
        count: activityCount
      })
    );
  }
};

export const emitUnreadMessagesCount = async (
  userId: s.users.Selectable['id']
) => {
  const socketIds = await getUserSocketIds(userId);
  if (socketIds.length > 0) {
    const messagesCount = await getUnreadMessagesCount(userId);
    socketIds.map((socketId) =>
      io.to(socketId).emit(ClientConversationEvents.UNREAD_MESSAGES_COUNT, {
        count: messagesCount
      })
    );
  }
};
