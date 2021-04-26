import {
  SocketJWT,
  StatusCallback,
  UserRedisData,
  AMPLITUDE_CONVERSATION_EVENTS
} from '../types';
import { joinRoom, getRedisUserInfo } from './helpers';
import {
  logger,
  redis,
  pgPool,
  extractNotificationTokensFromUsersDevices,
  newMessageInformationNotification,
  getUnreadMessagesCount,
  getUnreadActivitiesCount,
  emitUnreadMessagesCount,
  amplitude
} from '../utils';
import {
  ServerConversationEvents,
  ClientConversationEvents
} from './constants';
import * as s from '../zapatos/schema';
import * as db from '../zapatos/src';
import {
  ConversationSendMessageData,
  ConversationDeleteMessageData,
  ConversationReactMessagedata,
  GetConversationsData,
  GetConversationData,
  ConversationReadMessageData
} from '../types/sockets/conversations';

const joinConversationRooms = async (
  io: SocketIO.Server,
  socket: SocketJWT,
  deviceId: string,
  statusCb: StatusCallback
) => {
  try {
    const getConversations = await db.sql<
      s.users_conversations_participants.SQL,
      Pick<s.users_conversations_participants.Selectable, 'conversationId'>[]
    >`SELECT ${'conversationId'} FROM ${'users_conversations_participants'} WHERE ${'userId'} = ${db.param(
      socket.userSession.id
    )}`.run(pgPool);
    await Promise.all(
      getConversations.map(async (conversation) => {
        await joinRoom(io, socket.id, conversation.conversationId);
      })
    );
    await redis.hset(deviceId, 'inConversationRooms', 'true');
    statusCb('ok');
  } catch (err) {
    logger.error('joinConversationRooms()', err);
    statusCb('error');
  }
};

const reactToMessage = async (
  socket: SocketJWT,
  data: ConversationReactMessagedata,
  statusCb: StatusCallback
) => {
  try {
    const alreadyReacted = await db.sql<
      s.users_conversations_participants_messages_reactions.SQL,
      { exists: boolean }[]
    >`SELECT EXISTS (
      SELECT 1 FROM ${'users_conversations_participants_messages_reactions'}
      WHERE ${'userId'} = ${db.param(socket.userSession.id)}
      AND ${'messageId'} = ${db.param(data.messageId)}
      AND ${'conversationId'} = ${db.param(data.conversationId)})`.run(pgPool);
    const results = await db.sql<
      s.users_conversations_participants_messages_reactions.SQL,
      {
        result: {
          deleted: s.users_conversations_participants_messages_reactions.Selectable['deleted'];
          action: 'INSERT' | 'UPDATE';
        };
      }[]
    >`INSERT INTO ${'users_conversations_participants_messages_reactions'} (${'conversationId'}, ${'userId'}, ${'messageId'}, ${'reaction'})
  VALUES (${db.param(data.conversationId)}, ${db.param(
      socket.userSession.id
    )}, ${db.param(data.messageId)}, ${db.param(data.reaction)})
    ON CONFLICT ON CONSTRAINT users_conversations_participants_messages_reactions_pkey
    DO
    UPDATE SET
    ${'reaction'} = EXCLUDED.${'reaction'},
    ${'deleted'} = NOT ${'users_conversations_participants_messages_reactions'}.${'deleted'}
    RETURNING jsonb_build_object('deleted', ${'users_conversations_participants_messages_reactions'}.${'deleted'}, 'action', (CASE xmax
      WHEN 0 THEN
        'INSERT'
      ELSE
        'UPDATE'
      END)) AS result`.run(pgPool);

    socket
      .to(data.conversationId)
      .emit(ClientConversationEvents.CONVERSATION_MESSAGE_REACTED, {
        conversationId: data.conversationId,
        messageId: data.messageId,
        reaction: data.reaction,
        set:
          results[0].result.action === 'INSERT' ||
          (results[0].result.action === 'UPDATE' &&
            results[0].result.deleted === false)
            ? true
            : false
      });
    statusCb('ok');
    try {
      if (results[0].result.action === 'INSERT' && !alreadyReacted[0].exists) {
        const usernameStr: keyof Pick<UserRedisData, 'username'> = 'username';
        const myUsername = await redis.hget(socket.userSession.id, usernameStr);
        const messageRecord = await db.sql<
          s.users_conversations_messages.SQL,
          Pick<s.users_conversations_messages.Selectable, 'message'>[]
        >`SELECT ${'message'}
        FROM ${'users_conversations_messages'}
        WHERE ${'id'} = ${db.param(data.messageId)}`.run(pgPool);
        const messageUser = await db.sql<
          s.users_devices.SQL
        >`SELECT users_devices."notificationToken", users_devices.platform
        FROM users_conversations_messages
        JOIN users_devices ON users_conversations_messages."userId"=users_devices."userId"
        WHERE users_conversations_messages."id"=${db.param(data.messageId)}
        AND users_devices."notificationToken" IS NOT NULL AND users_conversations_messages."userId" <> ${db.param(
          socket.userSession.id
        )}`.run(pgPool);
        const notificationTokens = extractNotificationTokensFromUsersDevices(
          messageUser
        );
        if (notificationTokens) {
          await newMessageInformationNotification({
            customData: {
              conversationId: data.conversationId,
              message: messageRecord[0].message,
              interaction: 'reaction',
              username: myUsername!,
              reaction: data.reaction
            },
            notificationTokens
          });
        }
      }
    } catch (err) {
      logger.error('reactToMessage() sendNotification', err);
    }
  } catch (err) {
    logger.error('reactToMessage()', err);
    statusCb('error');
  }
};

const sendMessage = async (
  socket: SocketJWT,
  data: ConversationSendMessageData,
  statusCb: StatusCallback
) => {
  try {
    const messageDB = await db.sql<
      s.users_conversations_messages.SQL,
      s.users_conversations_messages.Selectable[]
    >`INSERT INTO ${'users_conversations_messages'} (${'userId'}, ${'message'}, ${'conversationId'})
    VALUES (${db.param(socket.userSession.id)}, ${db.param(
      data.message.substring(0, 1001)
    )}, ${db.param(data.conversationId)}) RETURNING *`.run(pgPool);
    const userInfo = await getRedisUserInfo(socket.userSession.id, [
      'username',
      'avatar'
    ]);
    const readStatuses = await db.sql<s.users_conversations_messages.SQL>`
      SELECT users_conversations_participants_messages_statuses.read, username, avatar
      FROM users_conversations_participants_messages_statuses
      JOIN users ON users_conversations_participants_messages_statuses."userId"=users.id
      WHERE users_conversations_participants_messages_statuses."messageId"=${db.param(
        messageDB[0].id
      )}`.run(pgPool);
    const newMessage = {
      ...messageDB[0],
      ...userInfo,
      readStatuses: readStatuses,
      sent: true,
      reactions: []
    };
    delete newMessage['userId'];
    socket
      .to(data.conversationId)
      .emit(ClientConversationEvents.CONVERSATION_NEW_MESSAGE, newMessage);
    statusCb('ok', newMessage);

    const conversationData = await db.sql<
      | s.users.SQL
      | s.users_blocklist.SQL
      | s.users_conversations_participants_messages_statuses.SQL
      | s.users_conversations_messages.SQL
    >`
    SELECT
    COALESCE((
      SELECT json_agg(info)
      FROM (
        SELECT "username", "avatar", "banned",
        (CASE WHEN users.id <> ${db.param(
          socket.userSession.id
        )} THEN (EXISTS (SELECT 1 FROM users_blocklist WHERE "userId"=users.id AND "blockedId"=${db.param(
      socket.userSession.id
    )})) ELSE false END) AS "blockedBy",
    (CASE WHEN users.id <> ${db.param(
      socket.userSession.id
    )} THEN (EXISTS (SELECT 1 FROM users_blocklist WHERE "userId"=${db.param(
      socket.userSession.id
    )} AND "blockedId"=users.id)) ELSE false END) AS "isBlocked"
        FROM users_conversations_participants
        JOIN users ON users_conversations_participants."userId"=users.id
        WHERE users_conversations_participants."conversationId"=parent_participants."conversationId"
        ORDER BY "username"
      ) info
    ), '[]'::json) AS participants
    FROM users_conversations_participants parent_participants
    WHERE parent_participants."conversationId"=${db.param(data.conversationId)}
  `.run(pgPool);

    const newConversationMessage = {
      conversationId: data.conversationId,
      participants: conversationData[0].participants,
      message: { ...newMessage, read: true, sent: true }
    };
    socket.emit(
      ClientConversationEvents.CONVERSATIONS_NEW_MESSAGE,
      newConversationMessage
    );
    const newConversationMessageOthers = {
      conversationId: data.conversationId,
      participants: conversationData[0].participants,
      message: { ...newMessage, read: false, sent: false }
    };
    socket
      .to(data.conversationId)
      .emit(
        ClientConversationEvents.CONVERSATIONS_NEW_MESSAGE,
        newConversationMessageOthers
      );
    socket
      .to(data.conversationId)
      .emit(ClientConversationEvents.UNREAD_MESSAGES_COUNT_INCREMENT);

    try {
      const chatParticipants = await db.sql<
        s.users_devices.SQL
      >`SELECT users_devices."notificationToken", users_devices.platform
        FROM users_conversations_participants
        JOIN users_devices ON users_conversations_participants."userId"=users_devices."userId"
        WHERE "conversationId"=${db.param(data.conversationId)}
        AND users_devices."notificationToken" IS NOT NULL AND users_conversations_participants."userId" <> ${db.param(
          socket.userSession.id
        )}`.run(pgPool);
      const notificationTokens = extractNotificationTokensFromUsersDevices(
        chatParticipants
      );
      if (notificationTokens) {
        await newMessageInformationNotification({
          customData: {
            conversationId: data.conversationId,
            message: data.message,
            interaction: 'new',
            username: userInfo.username!
          },
          notificationTokens
        });
      }
    } catch (err) {
      logger.error('sendMessage() sendNotification', err);
    }
    try {
      await amplitude.track({
        event_type: AMPLITUDE_CONVERSATION_EVENTS.NEW_MESSAGE,
        user_id: socket.userSession.id,
        event_properties: {
          conversationId: data.conversationId,
          messageId: messageDB[0].id
        }
      });
    } catch (err) {
      logger.error('sendMessage() amplitude', err);
    }
  } catch (err) {
    logger.error('sendMessage()', err);
    statusCb('error');
  }
};

const deleteMessage = async (
  socket: SocketJWT,
  data: ConversationDeleteMessageData,
  statusCb: StatusCallback
) => {
  try {
    await db.sql<
      s.users_conversations_messages.SQL
    >`DELETE FROM ${'users_conversations_messages'}
    WHERE ${'id'} = ${db.param(data.messageId)} AND ${'userId'} = ${db.param(
      socket.userSession.id
    )}`.run(pgPool);
    socket
      .to(data.conversationId)
      .emit(ClientConversationEvents.CONVERSATION_MESSAGE_DELETED, {
        conversationId: data.conversationId,
        messageId: data.messageId
      });
    statusCb('ok');
  } catch (err) {
    logger.error('deleteMessage()', err);
    statusCb('error');
  }
};

const createConversation = async (
  io: SocketIO.Server,
  socket: SocketJWT,
  data: {
    usernames: s.users.Selectable['username'][];
  },
  statusCb: StatusCallback
) => {
  try {
    const users = await db.sql<
      s.users.SQL,
      Pick<s.users.Selectable, 'id'>[]
    >`SELECT ${'id'} FROM ${'users'} WHERE ${'username'} = ANY(${db.param(
      data.usernames
    )})`.run(pgPool);

    const userIds = users.map((user) => user.id);
    userIds.push(socket.userSession.id);

    const existingConversation = await db.sql<
      s.users_conversations_participants.SQL,
      Pick<s.users_conversations_participants.Selectable, 'conversationId'>[]
    >`SELECT ${'conversationId'}
      FROM ${'users_conversations_participants'}
      WHERE ${'userId'} = ANY(${db.param(userIds)})
      AND ${'conversationId'}
      NOT IN (
        SELECT ${'conversationId'}
        FROM ${'users_conversations_participants'}
        WHERE ${'userId'} = ALL(${db.param(userIds)})
      )
      GROUP BY ${'conversationId'} HAVING COUNT(*) = ${db.param(
      userIds.length
    )}`.run(pgPool);
    if (existingConversation.length > 0) {
      return statusCb('ok', {
        conversationId: existingConversation[0].conversationId
      });
    }

    const conversation = await db.sql<
      s.users_conversations.SQL,
      Pick<s.users_conversations.Selectable, 'id'>[]
    >`INSERT INTO ${'users_conversations'} DEFAULT VALUES RETURNING ${'id'}`.run(
      pgPool
    );

    const conversationParticipants = users.map((user) => ({
      userId: user.id,
      conversationId: conversation[0].id
    }));
    conversationParticipants.push({
      userId: socket.userSession.id,
      conversationId: conversation[0].id
    });

    await db
      .insert('users_conversations_participants', conversationParticipants)
      .run(pgPool);

    // add anyone online to new conversation new conversation to anyone online
    const socketIdsOfOtherParticipants = await db.sql<
      s.online_users.SQL,
      Pick<s.online_users.Selectable, 'socketId'>[]
    >`SELECT ${'socketId'} FROM ${'online_users'} WHERE ${'userId'}=ANY(${db.param(
      userIds
    )})`.run(pgPool);
    await Promise.all(
      socketIdsOfOtherParticipants.map(async (socketOtherParticipants) => {
        await joinRoom(
          io,
          socketOtherParticipants.socketId,
          conversation[0].id
        );
      })
    );
    statusCb('ok', { conversationId: conversation[0].id });
    try {
      await amplitude.track({
        event_type: AMPLITUDE_CONVERSATION_EVENTS.NEW_CONVERSATION,
        user_id: socket.userSession.id,
        event_properties: {
          conversationId: conversation[0].id
        }
      });
    } catch (err) {
      logger.error('newConversation() amplitude', err);
    }
  } catch (err) {
    logger.error('newConversation()', err);
    statusCb('error');
  }
};

const getUnreadMessageCount = async (
  socket: SocketJWT,
  statusCb: StatusCallback
) => {
  try {
    const unread = await getUnreadMessagesCount(socket.userSession.id);
    statusCb('ok', {
      count: unread
    });
  } catch (err) {
    statusCb('error');
    logger.error('getUnreadMessageCount()', err);
  }
};

const getUnreadActivityCount = async (
  socket: SocketJWT,
  statusCb: StatusCallback
) => {
  try {
    const unread = await getUnreadActivitiesCount(socket.userSession.id);
    statusCb('ok', {
      count: unread
    });
  } catch (err) {
    statusCb('error');
    logger.error('getUnreadActivityCount()', err);
  }
};

const getConversations = async (
  socket: SocketJWT,
  data: GetConversationsData,
  statusCb: StatusCallback
) => {
  try {
    const page: number = Number(data.page) || 1;
    const pageSize = Number(data.pageSize) || 10;
    const conversationData = await db.sql<
      | s.users.SQL
      | s.users_blocklist.SQL
      | s.users_conversations_participants_messages_statuses.SQL
      | s.users_conversations_messages.SQL
    >`
    SELECT parent_participants."conversationId",
    COALESCE((
      SELECT json_agg(info)
      FROM (
        SELECT "username", "avatar", "banned",
        (CASE WHEN users.id <> ${db.param(
          socket.userSession.id
        )} THEN (EXISTS (SELECT 1 FROM users_blocklist WHERE "userId"=users.id AND "blockedId"=${db.param(
      socket.userSession.id
    )})) ELSE false END) AS "blockedBy",
    (CASE WHEN users.id <> ${db.param(
      socket.userSession.id
    )} THEN (EXISTS (SELECT 1 FROM users_blocklist WHERE "userId"=${db.param(
      socket.userSession.id
    )} AND "blockedId"=users.id)) ELSE false END) AS "isBlocked"
        FROM users_conversations_participants
        JOIN users ON users_conversations_participants."userId"=users.id
        WHERE users_conversations_participants."conversationId"=parent_participants."conversationId"
        ORDER BY "username"
      ) info
    ), '[]'::json) AS participants,
    row_to_json(recent_message) AS message
    FROM users_conversations_participants parent_participants
    LEFT JOIN LATERAL (
      SELECT users_conversations_messages."id", "message", users_conversations_messages."createdAt", "conversationId", "username", "avatar",
      COALESCE((
            SELECT users_conversations_participants_messages_statuses.read
            FROM users_conversations_participants_messages_statuses
            WHERE users_conversations_participants_messages_statuses."messageId"=users_conversations_messages.id
            AND users_conversations_participants_messages_statuses."userId"=${db.param(
              socket.userSession.id
            )}
      ), false) AS "read"
          FROM users_conversations_messages
          JOIN users ON users_conversations_messages."userId"=users.id
          WHERE "conversationId"=parent_participants."conversationId"
          ORDER BY "createdAt" DESC
          LIMIT 1
    ) recent_message ON recent_message."conversationId"=parent_participants."conversationId"
    WHERE parent_participants."userId"=${db.param(socket.userSession.id)}
    AND recent_message.id IS NOT NULL
    ORDER BY recent_message."createdAt" DESC
    LIMIT ${db.param(pageSize)}
    OFFSET ${db.param((page - 1) * pageSize)}
  `.run(pgPool);
    statusCb('ok', {
      page,
      pageSize,
      reachedEnd: conversationData.length < pageSize,
      conversations: conversationData
    });
  } catch (err) {
    logger.error('getConversations()', err);
  }
};

const getConversation = async (
  socket: SocketJWT,
  data: GetConversationData,
  statusCb: StatusCallback
) => {
  try {
    const page: number = Number(data.page) || 1;
    const pageSize = Number(data.pageSize) || 10;
    const conversationId = data.conversationId;
    if (!conversationId) {
      throw new Error('Conversation ID is undefined');
    }

    const conversationData = await db.sql<
      | s.users.SQL
      | s.users_conversations_participants_messages_reactions.SQL
      | s.users_conversations_participants_messages_reactions_total.SQL
      | s.users_conversations_messages.SQL,
      {
        conversationId: string;
        participants: [];
        messages: (Pick<s.users_conversations_messages.Selectable, 'id'> & {
          readStatuses: { read: boolean; username: string; avatar: string }[];
        })[];
      }[]
    >`
  SELECT users_conversations.id AS "conversationId",
  COALESCE((
    SELECT json_agg(info)
    FROM (
      SELECT "username", "avatar", "firstName", "lastName", "banned",
      (CASE WHEN users.id <> ${db.param(
        socket.userSession.id
      )} THEN (EXISTS (SELECT 1 FROM users_blocklist WHERE "userId"=users.id AND "blockedId"=${db.param(
      socket.userSession.id
    )})) ELSE false END) AS "blockedBy",
    (CASE WHEN users.id <> ${db.param(
      socket.userSession.id
    )} THEN (EXISTS (SELECT 1 FROM users_blocklist WHERE "userId"=${db.param(
      socket.userSession.id
    )} AND "blockedId"=users.id)) ELSE false END) AS "isBlocked"
      FROM users_conversations_participants
      JOIN users ON users_conversations_participants."userId"=users.id
      WHERE users_conversations_participants."conversationId"=users_conversations."id"
      ORDER BY "username"
    ) info
  ), '[]'::json) AS participants,
  COALESCE((
    SELECT json_agg(recent_messages)
    FROM (
      SELECT users_conversations_messages."id", "message", users_conversations_messages."createdAt", "conversationId", "username", "avatar",
      COALESCE((
        SELECT json_agg(json_build_object('read', users_conversations_participants_messages_statuses.read, 'username', username, 'avatar', avatar))
        FROM users_conversations_participants_messages_statuses
        JOIN users ON users_conversations_participants_messages_statuses."userId"=users.id
        WHERE users_conversations_participants_messages_statuses."messageId"=users_conversations_messages.id
      ), '[]'::json) AS "readStatuses",
      COALESCE((
        SELECT json_agg(
          jsonb_build_object('reaction', users_conversations_participants_messages_reactions_total.reaction, 'count', users_conversations_participants_messages_reactions_total.count, 'reacted',
            EXISTS
            (
              SELECT 1 FROM ${'users_conversations_participants_messages_reactions'}
              WHERE ${'users_conversations_participants_messages_reactions'}.${'messageId'}=${'users_conversations_messages'}.${'id'}
              AND ${'users_conversations_participants_messages_reactions'}.${'userId'}=${db.param(
      socket.userSession.id
    )}
              AND ${'users_conversations_participants_messages_reactions'}.${'reaction'}=${'users_conversations_participants_messages_reactions_total'}.${'reaction'}
              AND ${'users_conversations_participants_messages_reactions'}.${'deleted'}=${db.param(
      false
    )}
            )
          )
        )
        FROM users_conversations_participants_messages_reactions_total
        WHERE users_conversations_participants_messages_reactions_total."messageId"=users_conversations_messages.id
      ), '[]'::json) AS "reactions",
      (CASE WHEN users_conversations_messages."userId" = ${db.param(
        socket.userSession.id
      )} THEN TRUE ELSE FALSE END) AS "sent"
            FROM users_conversations_messages
        JOIN users ON users_conversations_messages."userId"=users.id
            WHERE "conversationId"=users_conversations.id
            ORDER BY "createdAt" DESC
            LIMIT ${db.param(pageSize)}
            OFFSET ${db.param((page - 1) * pageSize)}
    ) recent_messages
  ), '[]'::json) AS messages
  FROM users_conversations
  WHERE users_conversations.id=${db.param(conversationId)}
  `.run(pgPool);
    statusCb('ok', {
      page,
      pageSize,
      reachedEnd: conversationData[0].messages.length < pageSize,
      conversation: conversationData[0]
    });
    try {
      await db.sql<
        s.users_conversations_participants_messages_statuses.SQL
      >`UPDATE ${'users_conversations_participants_messages_statuses'}
      SET ${'read'} = ${db.param(true)}
      WHERE ${'conversationId'}=${db.param(
        conversationId
      )} AND ${'userId'}=${db.param(socket.userSession.id)}
       AND ${'read'} = ${db.param(false)}`.run(pgPool);
      socket.emit(ClientConversationEvents.UNREAD_MESSAGES_COUNT, {
        count: await getUnreadMessagesCount(socket.userSession.id)
      });
    } catch (err) {
      logger.error('getConversation() update read status', err);
    }
    const userInfo = await getRedisUserInfo(socket.userSession.id, [
      'username'
    ]);
    socket
      .to(data.conversationId)
      .emit(ClientConversationEvents.CONVERSATION_OTHER_MESSAGE_READ, userInfo);
  } catch (err) {
    logger.error('getConversation()', err);
  }
};

const getMessages = async (
  socket: SocketJWT,
  data: GetConversationData,
  statusCb: StatusCallback
) => {
  try {
    const page: number = Number(data.page) || 1;
    const pageSize = Number(data.pageSize) || 10;
    const conversationId = data.conversationId;

    const messagesData = await db.sql<
      | s.users.SQL
      | s.users_blocklist.SQL
      | s.users_conversations_participants_messages_statuses.SQL
      | s.users_conversations_messages.SQL
      | s.users_conversations_participants_messages_reactions.SQL
      | s.users_conversations_participants_messages_reactions_total.SQL,
      (Pick<s.users.Selectable, 'username' | 'avatar'> &
        Pick<
          s.users_conversations_messages.Selectable,
          'message' | 'conversationId'
        > & { sent: boolean })[]
    >`
    SELECT ${'users'}.${'username'}, ${'users'}.${'avatar'}, ${'users_conversations_messages'}.${'message'}, ${'users_conversations_messages'}.${'conversationId'}, ${'users_conversations_messages'}.${'id'}, ${'users_conversations_messages'}.${'createdAt'},
    COALESCE((
      SELECT json_agg(json_build_object('read', users_conversations_participants_messages_statuses.read, 'username', username, 'avatar', avatar))
      FROM users_conversations_participants_messages_statuses
      JOIN users ON users_conversations_participants_messages_statuses."userId"=users.id
      WHERE users_conversations_participants_messages_statuses."messageId"=users_conversations_messages.id
    ), '[]'::json) AS "readStatuses",
    COALESCE((
      SELECT json_agg(
        jsonb_build_object('reaction', users_conversations_participants_messages_reactions_total.reaction, 'count', users_conversations_participants_messages_reactions_total.count, 'reacted',
          EXISTS
          (
            SELECT 1 FROM ${'users_conversations_participants_messages_reactions'}
            WHERE ${'users_conversations_participants_messages_reactions'}.${'messageId'}=${'users_conversations_messages'}.${'id'}
            AND ${'users_conversations_participants_messages_reactions'}.${'userId'}=${db.param(
      socket.userSession.id
    )}
            AND ${'users_conversations_participants_messages_reactions'}.${'reaction'}=${'users_conversations_participants_messages_reactions_total'}.${'reaction'}
          )
        )
      )
      FROM users_conversations_participants_messages_reactions_total
      WHERE users_conversations_participants_messages_reactions_total."messageId"=users_conversations_messages.id
    ), '[]'::json) AS "reactions",
    (CASE WHEN ${'users_conversations_messages'}.${'userId'} = ${db.param(
      socket.userSession.id
    )} THEN TRUE ELSE FALSE END) AS "sent"
    FROM ${'users_conversations_messages'} JOIN ${'users'} ON ${'users_conversations_messages'}.${'userId'}=${'users'}.${'id'}
    WHERE ${'users_conversations_messages'}.${'conversationId'} = ${db.param(
      conversationId
    )}
    ORDER BY ${'users_conversations_messages'}.${'createdAt'} DESC LIMIT ${db.param(
      pageSize
    )} OFFSET ${db.param((page - 1) * pageSize)}
    `.run(pgPool);

    statusCb('ok', {
      page,
      pageSize,
      reachedEnd: messagesData.length < pageSize,
      messages: messagesData
    });
  } catch (err) {
    logger.error('getMessages()', err);
    statusCb('error');
  }
};

const readMessage = async (
  socket: SocketJWT,
  data: ConversationReadMessageData,
  statusCb: StatusCallback
) => {
  try {
    await db.sql<
      s.users_conversations_participants_messages_statuses.SQL
    >`UPDATE ${'users_conversations_participants_messages_statuses'}
      SET ${'read'} = ${db.param(true)}
      WHERE ${'messageId'}=${db.param(data.messageId)}
      AND ${'userId'}=${db.param(socket.userSession.id)}
      AND ${'conversationId'} = ${db.param(data.conversationId)}
       AND ${'read'} = ${db.param(false)}`.run(pgPool);
    socket.emit(ClientConversationEvents.CONVERSATIONS_MESSAGE_READ, {
      conversationId: data.conversationId
    });
    const userInfo = await getRedisUserInfo(socket.userSession.id, [
      'username'
    ]);
    socket
      .to(data.conversationId)
      .emit(ClientConversationEvents.CONVERSATION_OTHER_MESSAGE_READ, userInfo);
    socket.emit(ClientConversationEvents.UNREAD_MESSAGES_COUNT_DECREMENT);
    await emitUnreadMessagesCount(socket.userSession.id);
    statusCb('ok');
  } catch (err) {
    logger.error('readMessage()', err);
    statusCb('error');
  }
};

const blockParticipant = async (
  socket: SocketJWT,
  data: { username: s.users.Selectable['username']; conversationId: string },
  statusCb: StatusCallback
) => {
  try {
    const blockedUser = await db.sql<
      s.users.SQL,
      Pick<s.users.Selectable, 'id'>[]
    >`SELECT ${'id'} FROM ${'users'} WHERE ${'username'} = ${db.param(
      data.username
    )}`.run(pgPool);
    await db.sql<
      s.users_blocklist.SQL
    >`INSERT INTO ${'users_blocklist'} (${'userId'}, ${'blockedId'}) VALUES (${db.param(
      socket.userSession.id
    )}, ${db.param(
      blockedUser[0].id
    )}) ON CONFLICT ON CONSTRAINT users_blocklist_pkey DO NOTHING`.run(pgPool);
    const userInfo = await getRedisUserInfo(socket.userSession.id, [
      'username'
    ]);
    socket
      .to(data.conversationId)
      .emit(
        ClientConversationEvents.CONVERSATION_BLOCKED_BY_OTHER_PARTICIPANT,
        userInfo
      );
    statusCb('ok');
    try {
      await amplitude.track({
        event_type: AMPLITUDE_CONVERSATION_EVENTS.PARTICIPANT_BLOCKED,
        user_id: socket.userSession.id,
        event_properties: {
          conversationId: data.conversationId,
          blockedUserId: blockedUser[0].id
        }
      });
    } catch (err) {
      logger.error('blockParticipant() amplitude', err);
    }
  } catch (err) {
    logger.error(err);
    statusCb('error');
  }
};

const unblockParticipant = async (
  socket: SocketJWT,
  data: { username: s.users.Selectable['username']; conversationId: string },
  statusCb: StatusCallback
) => {
  try {
    const blockedUser = await db.sql<
      s.users.SQL,
      Pick<s.users.Selectable, 'id'>[]
    >`SELECT ${'id'} FROM ${'users'} WHERE ${'username'} = ${db.param(
      data.username
    )}`.run(pgPool);
    await db.sql<
      s.users_blocklist.SQL | s.users.SQL
    >`DELETE FROM ${'users_blocklist'} WHERE ${'userId'}=${db.param(
      socket.userSession.id
    )} AND ${'blockedId'} = ${db.param(blockedUser[0].id)}`.run(pgPool);
    const userInfo = await getRedisUserInfo(socket.userSession.id, [
      'username'
    ]);
    socket
      .to(data.conversationId)
      .emit(
        ClientConversationEvents.CONVERSATION_UNBLOCKED_BY_OTHER_PARTICIPANT,
        userInfo
      );
    statusCb('ok');
    try {
      await amplitude.track({
        event_type: AMPLITUDE_CONVERSATION_EVENTS.PARTICIPANT_UNBLOCKED,
        user_id: socket.userSession.id,
        event_properties: {
          conversationId: data.conversationId,
          unblockedUserId: blockedUser[0].id
        }
      });
    } catch (err) {
      logger.error('unblockParticipant() amplitude', err);
    }
  } catch (err) {
    logger.error(err);
    statusCb('error');
  }
};

export const initConversations = (
  io: SocketIO.Server,
  socket: SocketJWT,
  deviceId: string,
  inConversationRooms: boolean
) => {
  socket.on(ServerConversationEvents.GET_UNREAD_MESSAGE_COUNT, (statusCb) =>
    getUnreadMessageCount(socket, statusCb)
  );

  socket.on(ServerConversationEvents.GET_UNREAD_ACTIVITY_COUNT, (statusCb) =>
    getUnreadActivityCount(socket, statusCb)
  );

  if (inConversationRooms)
    joinConversationRooms(io, socket, deviceId, () => {}).catch((err) =>
      logger.error(err)
    );

  socket.on(ServerConversationEvents.JOIN_CONVERSATION_ROOMS, (statusCb) =>
    joinConversationRooms(io, socket, deviceId, statusCb)
  );

  socket.on(ServerConversationEvents.GET_CONVERSATIONS, (data, statusCb) =>
    getConversations(socket, data, statusCb)
  );

  socket.on(ServerConversationEvents.GET_CONVERSATION, (data, statusCb) =>
    getConversation(socket, data, statusCb)
  );

  socket.on(ServerConversationEvents.GET_MESSAGES, (data, statusCb) =>
    getMessages(socket, data, statusCb)
  );

  socket.on(ServerConversationEvents.SEND_MESSAGE, (data, statusCb) =>
    sendMessage(socket, data, statusCb)
  );

  socket.on(ServerConversationEvents.READ_MESSAGE, (data, statusCb) =>
    readMessage(socket, data, statusCb)
  );

  socket.on(ServerConversationEvents.REACT_MESSAGE, (data, statusCb) =>
    reactToMessage(socket, data, statusCb)
  );

  socket.on(ServerConversationEvents.DELETE_MESSAGE, (data, statusCb) =>
    deleteMessage(socket, data, statusCb)
  );

  socket.on(ServerConversationEvents.CREATE_CONVERSATION, (data, statusCb) =>
    createConversation(io, socket, data, statusCb)
  );

  socket.on(ServerConversationEvents.BLOCK_PARTICIPANT, (data, statusCb) =>
    blockParticipant(socket, data, statusCb)
  );

  socket.on(ServerConversationEvents.UNBLOCK_PARTICIPANT, (data, statusCb) =>
    unblockParticipant(socket, data, statusCb)
  );

  // TODO handle deleting conversations
};
