import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { configureExpress } from './express';
import express from 'express';
import { logger, pgPool } from './utils';
import { PORT } from './config';

const cleanupConnectionsOnCrash = () => {
  pgPool.end().catch;
};

process.on('unhandledRejection', (reason, promise) => {
  console.error(`Unhandled Rejection at:', ${promise}\n, 'reason:', ${reason}`);
  cleanupConnectionsOnCrash();

  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error(`Caught Exception ${err}\n`);
  cleanupConnectionsOnCrash();
  process.exit(1);
});

const app = express();
configureExpress(app);

app.listen(PORT, () => {
  logger.info(`Listening on PORT ${PORT}...`);
});
