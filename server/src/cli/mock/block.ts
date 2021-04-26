import { getUser, createUsers } from './utils/user';
import { GenerateForUserArgs } from './utils';
import chalk from 'chalk';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { pgPool } from '../../utils';

export const addToBlockList = async (args: GenerateForUserArgs) => {
  const count = Number(args.count);
  const username = args.username;

  const user = await getUser(username);
  let randomUsers: s.users.JSONSelectable[] = [];
  randomUsers = [
    ...(await db
      .select(
        'users',
        { username: db.sql<db.SQL>`${db.self} <> ${db.param(username)}` },
        { order: [{ by: db.sql`random()`, direction: 'ASC' }], limit: count }
      )
      .run(pgPool))
  ];

  if (randomUsers.length < count) {
    randomUsers = [
      ...randomUsers,
      ...(await createUsers(count - randomUsers.length))
    ];
  }

  await db
    .insert(
      'users_blocklist',
      randomUsers.map((u) => ({ userId: user.id, blockedId: u.id }))
    )
    .run(pgPool);

  console.log(
    chalk.green(
      `Successfully added ${randomUsers.length} blocked users to the "${username}'s block list".`
    )
  );
};
