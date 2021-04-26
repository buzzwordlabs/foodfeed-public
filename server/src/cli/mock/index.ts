import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { createTestUser } from './utils/user';
import { generateImagePosts, generatePostComments } from './posts';
import { generateCallHistories, generateLiveStreamHistories } from './history';

import { createTopics } from './topics';
import { generateFollowers } from './followers';
import { program } from 'commander';
import { startSockets } from '../../sockets';
import { addToBlockList } from './block';
import { addViewersToStream } from './stream';
import { GenerateForUserArgs } from './utils';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { pgPool } from '../../utils';
import { generateConversations } from './conversations';

const exit = async (args: any, fn: (args: any) => any) => {
  await fn(args);
  process.exit(0);
};

const main = () => {
  // Commands
  program
    .command('init')
    .option('-u, --username <username>', 'Username to add the followers to')
    .option('-c, --count <number>', 'Count of followers to add')
    .action(async (args) => {
      let user: s.users.JSONSelectable;
      if (!args.username) {
        user = (await createTestUser()) as s.users.JSONSelectable;
      } else if (args.username === 'random') {
        user = (await createTestUser(args.username)) as s.users.JSONSelectable;
      } else {
        user = (await db
          .selectOne('users', {
            username: args.username
          })
          .run(pgPool)) as s.users.JSONSelectable;
      }
      const userArgs: GenerateForUserArgs = {
        username: args.username || user.username,
        count: args.count || '100'
      };
      await createTopics();
      await generateFollowers(userArgs);
      await generateLiveStreamHistories(userArgs);
      await generateCallHistories({ ...userArgs, type: 'calling' });
      await generateCallHistories({ ...userArgs, type: 'receiving' });
      await generateConversations({ ...userArgs, count: '10' });
      const posts = await generateImagePosts(userArgs);
      await Promise.all(
        posts.map(
          async (post) =>
            await generatePostComments({
              postId: post.id,
              username: user.username,
              count: '10'
            })
        )
      );
      await addToBlockList({ ...userArgs, count: '10' });
      process.exit(0);
    });

  program
    .command('generate-followers')
    .requiredOption(
      '-u, --username <username>',
      'Username to add the followers to'
    )
    .requiredOption('-c, --count <number>', 'Count of followers to add')
    .action(async (args) => exit(args, generateFollowers));

  program.command('add-topics').action(async () => createTopics());
  program
    .command('generate-conversations')
    .action(async (args) => exit(args, generateConversations));
  program
    .command('generate-live-stream-histories')
    .requiredOption(
      '-u, --username <username>',
      'Username to add the stream histories to'
    )
    .requiredOption('-c, --count <number>', 'Count of stream histories to add')
    .action(async (args) => exit(args, generateLiveStreamHistories));

  program
    .command('generate-call-histories')
    .requiredOption(
      '-u, --username <username>',
      'Username to add the call histories to'
    )
    .requiredOption('-c, --count <number>', 'Count of call histories to add')
    .requiredOption(
      '-t, --type <receiving | calling>',
      'If the username provided is receiving or calling.'
    )
    .action(async (args) => exit(args, generateCallHistories));

  program
    .command('generate-image-posts')
    .requiredOption(
      '-u, --username <username>',
      'Username to add the call histories to'
    )
    .requiredOption('-c, --count <number>', 'Count of call histories to add')
    .action(async (args) => exit(args, generateImagePosts));
  program
    .command('generate-post-comments')
    .requiredOption('-u, --username <username>', 'Username of the post owner')
    .requiredOption('-pid, --postId <postId>', 'Post to add the comments to')
    .requiredOption('-c, --count <number>', 'Count of comments to add')
    .action(async (args) => exit(args, generatePostComments));

  program
    .command('add-viewers-to-stream')
    .requiredOption(
      '-u, --username <username>',
      'Username of stream to add the viewers to'
    )
    .requiredOption('-c, --count <number>', 'Count of viewers to add')
    .action(async (args) => exit(args, addViewersToStream));

  program
    .command('add-to-blocklist')
    .requiredOption(
      '-u, --username <username>',
      'Username to add the blocklist users to'
    )
    .requiredOption('-c, --count <number>', 'Count of blocklist users to add')
    .action(async (args) => exit(args, addToBlockList));

  program
    .command('start-sockets')
    .requiredOption(
      '-u, --usernames <usernames>',
      'Your usernames to ignore, comma-separated values, DO NOT PUT ANY SPACES'
    )
    .action(async (args) => startSockets(args));

  program.parse(process.argv);
};

process.on('unhandledRejection', (reason, promise) => {
  console.error(`Unhandled Rejection at:', ${promise}\n, 'reason:', ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error(`Caught Exception ${err}\n`);
  process.exit(1);
});

main();
