import chalk from 'chalk';
import topics from './data/topics';
import { pgPool } from '../../utils';
import * as db from '../../zapatos/src';

export const createTopics = async () => {
  try {
    await db.insert('topics', topics).run(pgPool);
    console.log(
      chalk.green(
        `Successfully added ${topics.length} topics to the "topics" table!`
      )
    );
  } catch (err) {}
};
