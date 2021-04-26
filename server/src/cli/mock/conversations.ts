import {
  GenerateForUserArgs,
  getUser,
  generateSingleConversation
} from './utils';

import chalk from 'chalk';

export const generateConversations = async (args: GenerateForUserArgs) => {
  const { username, count } = args;
  const currentUser = await getUser(username);

  await Promise.all(
    Array.from({ length: Number(30) }).map(async () => {
      await generateSingleConversation({
        username: currentUser.username,
        userId: currentUser.id
      });
    })
  );

  console.log(
    chalk.green(
      `Successfully created ${count} conversations started by "${username}".`
    )
  );
};
