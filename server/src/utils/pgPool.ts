import pg from 'pg';
import { DATABASE_URL } from '../config';
import { logger } from '.';
export const pgPool = new pg.Pool({
  connectionString: DATABASE_URL
});
pgPool.on('error', (err, _client) => {
  logger.error('PG POOL ERROR', err);
});
