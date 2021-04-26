import * as s from '../../../zapatos/schema';
import * as db from '../../../zapatos/src';
import { pgPool } from '../../../utils';

import faker from 'faker';
import { getRandomUser } from './user';

export const generateSingleConversation = async ({
  username,
  userId
}: {
  username: string;
  userId: string;
}) => {
  try {
    const randomUser = await getRandomUser();

    const conversation = await db.sql<
      s.users_conversations.SQL,
      Pick<s.users_conversations.Selectable, 'id'>[]
    >`INSERT INTO ${'users_conversations'} DEFAULT VALUES RETURNING ${'id'}`.run(
      pgPool
    );

    const users = await db.sql<
      s.users.SQL,
      Pick<s.users.Selectable, 'id'>[]
    >`SELECT ${'id'} FROM ${'users'} WHERE ${'username'} = ANY(${db.param([
      username,
      randomUser[0].username
    ])})`.run(pgPool);

    const conversationParticipants = users.map((user) => ({
      userId: user.id,
      conversationId: conversation[0].id
    }));

    await db
      .insert('users_conversations_participants', conversationParticipants)
      .run(pgPool);

    await Promise.all(
      Array.from({ length: 15 }).map(async (_, index) => {
        const message = await db
          .insert('users_conversations_messages', {
            createdAt: faker.date.recent(2),
            userId: Math.random() < 0.5 ? userId : randomUser[0].id,
            message: `${index}`,
            // Math.random() < 0.33
            //   ? faker.random.words(3)
            //   : faker.lorem.sentences(3),
            conversationId: conversation[0].id
          })
          .run(pgPool);
        await db
          .insert('users_conversations_participants_messages_reactions', {
            conversationId: conversation[0].id,
            userId: message.userId,
            messageId: message.id,
            reaction: 'like'
          })
          .run(pgPool);
      })
    );
  } catch (err) {
    console.log('Error: ', err);
    process.exit(1);
  }
};
