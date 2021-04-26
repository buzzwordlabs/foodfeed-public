import { GenerateForUserArgs, getUser } from './utils';

import chalk from 'chalk';
import faker from 'faker';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { pgPool } from '../../utils';
import { random } from 'lodash';

export const generateImagePosts = async (args: GenerateForUserArgs) => {
  const count = Number(args.count);
  const { username } = args;

  const currentUser = await getUser(username);

  const users = await db
    .select(
      'users',
      { username: db.sql<db.SQL>`${db.self} <> ${db.param(username)}` },
      {
        order: [{ by: db.sql`random()`, direction: 'ASC' }],
        limit: 3
      }
    )
    .run(pgPool);

  const posts = await Promise.all(
    Array.from({ length: count }).map(async () => {
      const media =
        'https://www.helpguide.org/wp-content/uploads/table-with-grains-vegetables-fruit-768.jpg';
      const description =
        Math.random() > 0.5 ? faker.lorem.sentences() : faker.lorem.paragraph();
      const post = await db
        .insert('users_posts', {
          userId: currentUser.id,
          description
        })
        .run(pgPool);
      await db
        .insert('users_posts_media', {
          postId: post.id,
          type: 'image',
          uri: media,
          position: 0
        })
        .run(pgPool);
      const reactions = users.map((user) => ({
        postId: post.id,
        reaction: 'like',
        userId: user.id
      }));
      const comments = users.map((user) => ({
        postId: post.id,
        comment: faker.lorem.words(random(0, 30)),
        userId: user.id
      }));
      await Promise.all(
        Array.from({ length: reactions.length }).map(async (_, index) => {
          await db
            .insert('users_posts_reactions', reactions[index])
            .run(pgPool);
          await db.insert('users_posts_comments', comments[index]).run(pgPool);
        })
      );
      return post;
    })
  );

  console.log(
    chalk.green(
      `Successfully added ${posts.length} image posts by ${currentUser.username} to the "call_history" table!`
    )
  );
  return posts;
};

export const generatePostComments = async (
  args: { postId: string } & GenerateForUserArgs
) => {
  const count = Number(args.count);
  const { postId, username } = args;

  const user = await getUser(username);

  await Promise.all(
    Array.from({ length: count }).map(async () => {
      const comment = faker.lorem.words(random(0, 30));
      await db.sql<
        s.users_posts_comments.SQL
      >`INSERT INTO ${'users_posts_comments'} (${'postId'}, ${'userId'}, ${'comment'}) VALUES (${db.param(
        postId
      )}, ${db.param(user.id)}, ${db.param(comment)})`.run(pgPool);
    })
  );

  console.log(
    chalk.green(
      `Successfully added ${count} comments to postId ${postId} for user ${username}`
    )
  );
};
