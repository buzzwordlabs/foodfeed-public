import Redis from 'ioredis';
import {
  REDIS_URL,
  IS_PRODUCTION,
  REDIS_PROD_CLUSTER_HOSTS_ARRAY
} from '../config';

export const redis = IS_PRODUCTION
  ? new Redis.Cluster(REDIS_PROD_CLUSTER_HOSTS_ARRAY!)
  : new Redis(REDIS_URL);
