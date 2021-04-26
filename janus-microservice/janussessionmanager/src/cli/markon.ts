// This file is used when we want to allow track back on this instance
import dotenv from 'dotenv';
dotenv.config();
import { redis } from '../utils';
import { JanusManagerRedisData } from '../sockets/constants';
import { INSTANCE_URL } from '../config';

(async () => {
  redis
    .hdel(JanusManagerRedisData.JANUSMANAGERSTATUS, INSTANCE_URL!)
    .then(() => process.exit(0))
    .catch((err) => {
      console.log(err);
      process.exit(1);
    });
})().catch((err) => {
  console.log(err);
  process.exit(1);
});
