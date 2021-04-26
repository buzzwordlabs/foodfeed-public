import { body } from 'express-validator';

export const deviceTokenValidator = [
  body('token').not().isEmpty().isString(),
  body('deviceId').not().isEmpty().isString()
];
