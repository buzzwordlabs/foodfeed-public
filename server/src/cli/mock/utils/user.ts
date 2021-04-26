import faker from 'faker';
import chalk from 'chalk';
import { getMockDeviceData } from './device';
import * as db from '../../../zapatos/src';
import * as s from '../../../zapatos/schema';
import { pgPool } from '../../../utils';
import shortid from 'shortid';

export const getUser = async (username: s.users.Selectable['username']) => {
  const user = await db.selectOne('users', { username }).run(pgPool);
  if (!user) {
    console.log(
      chalk.red(`User for username "${username}" could not be found.`)
    );
    process.exit(1);
  }
  return user;
};

export const getRandomUser = async () => {
  const user = await db.sql<
    s.users.SQL,
    s.users.Selectable[]
  >`SELECT * FROM ${'users'} ORDER BY random() LIMIT 1`.run(pgPool);
  if (!user) {
    console.log(chalk.red(`Random user could not be found.`));
    process.exit(1);
  }
  return user;
};

export const createUsers = async (count: number) => {
  return Promise.all(
    Array.from({ length: count }).map(async () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const email = shortid.generate().toLowerCase() + '@' + 'foodfeed.com';
      const username = shortid.generate().toLowerCase();
      const avatar = faker.internet.avatar();
      return db
        .insert('users', {
          firstName,
          lastName,
          username,
          email,
          avatar,
          birthdate: new Date(2000, 1, 1),
          settings: {},
          onboardingStep: 0,
          banned: false,
          password: db.sql<db.SQL>`crypt(${db.param(
            'enaluz123A'
          )}, gen_salt('bf', 12))`
        })
        .run(pgPool);
    })
  );
};

export const createTestUser = async (customUsername?: string) => {
  const user = await db
    .selectOne('users', {
      username: customUsername || 'test'
    })
    .run(pgPool);
  if (user) return user;
  const firstName = 'Test';
  const lastName = 'Last';
  const email = `${customUsername?.toLowerCase() || 'test'}@${
    customUsername?.toLowerCase() || 'test'
  }.com`;
  const username = customUsername?.toLowerCase() || 'test';
  const avatar = faker.internet.avatar();
  try {
    return db
      .insert('users', {
        firstName,
        lastName,
        username,
        email,
        avatar,
        birthdate: new Date(2000, 1, 1),
        settings: {},
        onboardingStep: 0,
        banned: false,
        password: db.sql<db.SQL>`crypt(${db.param(
          'enaluz123A'
        )}, gen_salt('bf', 12))`
      })
      .run(pgPool);
  } catch (err) {
    const POSTGRES_DUP_ENTRY_ERROR_CODE = '23505';
    if (err.code === POSTGRES_DUP_ENTRY_ERROR_CODE) {
      return db
        .selectOne('users', {
          username: 'test'
        })
        .run(pgPool);
    }
  }
};

export const getCountUsers = async () => db.count('users', db.all).run(pgPool);

export const getUsers = async ({
  except,
  count
}: {
  except: string[];
  count: number;
}) => {
  let users = await db
    .select('users', { username: db.sql`NOT ALL=(${db.param(except)})` })
    .run(pgPool);

  const difference = count - users.length;
  if (difference) users = [...users, ...(await createUsers(difference))];
  return users;
};

export const getDevicesForUsers = async (users: s.users.JSONSelectable[]) => {
  return Promise.all(
    users.map(async (user) => {
      const existingDevice = await db
        .selectOne('users_devices', { userId: user.id })
        .run(pgPool);
      if (existingDevice) return existingDevice;
      return db
        .insert('users_devices', {
          ...getMockDeviceData(),
          userId: user.id
        })
        .run(pgPool);
    })
  );
};
