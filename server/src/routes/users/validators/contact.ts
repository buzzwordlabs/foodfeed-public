import { body } from 'express-validator';
export const contactMobileValidator = [
  body('message', 'No message found').not().isEmpty().isString(),
  body('reason').not().isEmpty().isString(),
  body('deviceInfo').not().isEmpty()
];
