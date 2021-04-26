import { query, body } from 'express-validator';

export const getPostValidator = [query('id').not().isEmpty()];

export const getPostsForUserValidator = [query('username').not().isEmpty()];

export const deletePostValidator = [body('id').not().isEmpty()];
