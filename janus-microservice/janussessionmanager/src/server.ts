import dotenv from 'dotenv';
dotenv.config();
import { INSTANCE_URL, PORT, FOODFEED_CRASHES_EMAIL } from './config';
import { logger, redis, sendEmail, pgPool } from './utils';

import http from 'http';
import socketIO from 'socket.io';
import { startSockets } from './sockets';
import { JanusManagerRedisData } from './sockets/constants';

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
const server = http.createServer();
export const io = socketIO(server);

redis.hset(
  JanusManagerRedisData.JANUSMANAGERS,
  INSTANCE_URL!,
  'true',
  (err, _res) => {
    if (err) {
      logger.error('createConnection()', err);
      sendEmail({
        from: FOODFEED_CRASHES_EMAIL,
        to: FOODFEED_CRASHES_EMAIL,
        subject: 'JANUS INSTANCE REDIS URL NOT SET',
        html: `A janus instance failed to set its url in redis at ${INSTANCE_URL}.`
      }).catch((err) => logger.error('createConnection()', err));
    }
  }
);
startSockets(io);

server.listen(PORT, () => {
  logger.info(`Listening on PORT ${PORT}...`);
});
