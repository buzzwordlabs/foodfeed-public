import {
  GenerateForUserArgs,
  getUser,
  createUsers,
  getDevicesForUsers
} from './utils';
import { pgPool } from '../../utils';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';

import chalk from 'chalk';
import faker from 'faker';

export const addViewersToStream = async (args: GenerateForUserArgs) => {
  const { username, count } = args;
  const currentUser = await getUser(username);

  const users = await createUsers(Number(count));

  const devices = await getDevicesForUsers(users);

  const getStream = await db
    .selectOne('online_users', {
      userId: currentUser.id
    })
    .run(pgPool);

  const onlineUsers: s.online_users.Insertable[] = devices.map((device) => ({
    deviceId: device.deviceId,
    userId: device.userId as string,
    socketId: faker.random.uuid(),
    isViewing: true,
    isStreaming: false,
    activeConnection: getStream?.deviceId
  }));
  await db.insert('online_users', onlineUsers).run(pgPool);

  console.log(
    chalk.green(
      `Successfully added ${onlineUsers.length} viewers to ${username}'s stream.`
    )
  );
};
