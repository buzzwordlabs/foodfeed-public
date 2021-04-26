import { body, query } from 'express-validator';

export const getMessagesValidator = [
  query('page', 'Only numbers allowed for page.').optional().isNumeric(),
  query('pageSize', 'Only numbers allowed for pageSize.').optional().isNumeric()
];

export const createMessageValidator = [body('message').not().isEmpty()];

export const deleteMessageValidator = [body('id').not().isEmpty()];

export const reactMessageValidator = [body('id').not().isEmpty()];
