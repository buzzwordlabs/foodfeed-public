import { body } from 'express-validator';

// TODO BACKCOMPAT add validator for post type once users are on newer version
export const reportUserValidator = [body('reason').not().isEmpty().isString()];

export const blockUserValidator = [body('username').not().isEmpty()];
