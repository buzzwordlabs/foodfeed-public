import {
  GenerateForUserArgs,
  getUser,
  createUsers,
  getDevicesForUsers
} from './utils';

import * as db from '../../zapatos/src';
import { pgPool } from '../../utils';

import chalk from 'chalk';

export const generateFollowers = async (args: GenerateForUserArgs) => {
  const { username, count } = args;
  const currentUser = await getUser(username);

  const users = await createUsers(Number(count));

  // Creates devices
  await getDevicesForUsers(users);

  const followers = users.map((user) => ({
    userId: currentUser.id,
    followerId: user.id
  }));

  await db.insert('users_followers', followers).run(pgPool);

  console.log(
    chalk.green(
      `Successfully created and added ${count} followers to the account of "${username}".`
    )
  );
};
