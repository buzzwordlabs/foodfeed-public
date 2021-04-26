// This file is used when we want to direct traffic away from this instance for maintainence
import dotenv from 'dotenv';
dotenv.config();
import { redis } from '../utils';
import { JanusManagerRedisData } from '../sockets/constants';
import { INSTANCE_URL } from '../config';

(async () => {
  redis
    .hset(JanusManagerRedisData.JANUSMANAGERSTATUS, INSTANCE_URL!, 'off')
    .then(() => process.exit(0))
    .catch((err) => {
      console.log(err);
      process.exit(1);
    });
})().catch((err) => {
  console.log(err);
  process.exit(1);
});
