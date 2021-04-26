import { body } from 'express-validator';

export const userInfoValidator = [
  body('deviceId').not().isEmpty().isString(),
  body('codePushVersion').not().isEmpty().isString(),
  body('appVersion').not().isEmpty().isString()
];
