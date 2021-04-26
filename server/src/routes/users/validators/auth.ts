import { body } from 'express-validator';

export const logoutValidator = [
  body('deviceId', 'Invalid code').not().isEmpty()
];
