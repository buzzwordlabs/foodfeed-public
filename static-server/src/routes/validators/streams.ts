import { query } from 'express-validator';

export const getPageValidator = [
  query('page').optional().isNumeric(),
  query('pageSize').optional().isNumeric()
];
