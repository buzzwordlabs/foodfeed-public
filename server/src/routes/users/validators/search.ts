import { param, query } from 'express-validator';

export const searchAccountsValidator = [
  query('username', 'No username string was provided.').not().isEmpty(),
  query('username', 'Only string usernames allowed.')
    .isString()
    .trim()
    .customSanitizer((value) => value.toLowerCase()),
  query('page', 'Only numbers allowed for page.').optional().isNumeric(),
  query('pageSize', 'Only numbers allowed for pageSize.').optional().isNumeric()
];

export const profileValidator = [
  param('username', 'No username string was provided.').not().isEmpty(),
  param('username', 'Only string usernames allowed.')
    .isString()
    .trim()
    .customSanitizer((value) => value.toLowerCase())
];

export const historyValidator = [
  param('username', 'No username string was provided.').not().isEmpty(),
  param('username', 'Only string usernames allowed.')
    .isString()
    .trim()
    .customSanitizer((value) => value.toLowerCase()),
  query('page', 'Only numbers allowed for page.').optional().isNumeric(),
  query('pageSize', 'Only numbers allowed for pageSize.').optional().isNumeric()
];
