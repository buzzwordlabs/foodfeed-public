import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { PORT } from './config';
import { logger, redis, pgPool } from './utils';

import { configureExpress } from './express';
import express from 'express';
import http from 'http';
import socketIO from 'socket.io';
import { startSockets } from './sockets';

const cleanupConnectionsOnCrash = () => {
  pgPool.end().catch;
  redis.disconnect();
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
const server = http.createServer(app);
export const io = socketIO(server);
startSockets(io).catch((err) => logger.error('startSockets()', err));

server.listen(PORT, () => {
  logger.info(`Listening on PORT ${PORT}...`);
});
