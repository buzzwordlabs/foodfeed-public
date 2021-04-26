import { GenerateForUserArgs, getUser } from './utils';

import chalk from 'chalk';
import faker from 'faker';

import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { pgPool } from '../../utils';

export const generateLiveStreamHistories = async (
  args: GenerateForUserArgs
) => {
  const count = Number(args.count);
  const username = args.username;

  const currentUser = await getUser(username);

  const newerDate = () => {
    const currentDate = new Date();
    currentDate.setSeconds(
      currentDate.getSeconds() + Math.floor(Math.random() * 1000)
    );
    return currentDate;
  };

  await Promise.all(
    Array.from({ length: count }).map(async () => {
      await db
        .insert('stream_history', {
          userId: currentUser!.id,
          title: faker.random.words(3),
          completedAt: newerDate()
        })
        .run(pgPool);
    })
  );

  console.log(
    chalk.green(
      `Successfully added ${count} live streams to the "stream_history" table!`
    )
  );
};

export const generateCallHistories = async (
  args: GenerateForUserArgs & { type: 'receiving' | 'calling' }
) => {
  const count = Number(args.count);
  const { username, type } = args;

  if (type !== 'receiving' && type !== 'calling') {
    console.log(
      chalk.red(
        `Argument type must be either "receiving" or "calling", not "${type}".`
      )
    );
    process.exit(1);
  }

  const currentUser = await getUser(username);

  const users = await db.sql<
    s.users.SQL,
    s.users.Selectable[]
  >`SELECT * FROM users ORDER BY random() LIMIT ${db.param(count)}`.run(pgPool);

  const newerDate = () => {
    const currentDate = new Date();
    currentDate.setSeconds(
      currentDate.getSeconds() + Math.floor(Math.random() * 1000)
    );
    return currentDate;
  };

  await Promise.all(
    users.map(async (user) =>
      db
        .insert('call_history', {
          callerId: type === 'calling' ? currentUser!.id : user.id,
          calleeId: type === 'calling' ? user.id : currentUser!.id,
          completedAt: newerDate()
        })
        .run(pgPool)
    )
  );

  console.log(
    chalk.green(
      `Successfully added ${users.length} calls ${
        type === 'calling' ? 'from' : 'to'
      } ${username} to the "call_history" table!`
    )
  );
};
