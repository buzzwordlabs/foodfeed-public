import { query, body } from 'express-validator';

export const followingValidator = (type: 'body' | 'query') => [
  type === 'body'
    ? body('username')
        .not()
        .isEmpty()
        .trim()
        .customSanitizer((value) => value.toLowerCase())
    : query('username')
        .not()
        .isEmpty()
        .trim()
        .customSanitizer((value) => value.toLowerCase())
];
