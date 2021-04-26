import Redis from 'ioredis';
import {
  REDIS_URL,
  IS_PRODUCTION,
  REDIS_PROD_CLUSTER_HOSTS_ARRAY
} from '../config';
import { ONE_WEEK_IN_SECONDS } from '.';

export const redis = IS_PRODUCTION
  ? new Redis.Cluster(REDIS_PROD_CLUSTER_HOSTS_ARRAY!)
  : new Redis(REDIS_URL);

export const refreshUserRedisPermission = async (
  userId: string,
  allowed: 'true' | 'false'
) => {
  await redis.set(`${userId}-allowed`, allowed);
  return redis.expire(`${userId}-allowed`, ONE_WEEK_IN_SECONDS);
};
