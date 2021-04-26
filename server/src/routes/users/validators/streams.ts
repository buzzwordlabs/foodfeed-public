import { query, body } from 'express-validator';

export const getPageValidator = [
  query('page').not().isEmpty().isInt(),
  query('pageSize').not().isEmpty().isInt()
];

export const getPageBodyValidator = [
  body('page').optional().isNumeric(),
  body('pageSize').optional().isNumeric(),
  body('deviceId').not().isEmpty()
];
