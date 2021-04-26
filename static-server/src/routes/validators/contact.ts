import { body } from 'express-validator';

export const contactFormValidator = [
  body('email', 'Invalid email').isEmail().normalizeEmail(),
  body('name', 'Name cannot be empty').not().isEmpty().isString(),
  body('message', 'Message cannot be empty').not().isEmpty().isString()
];

export const recaptchaValidator = [body('recaptcha').not().isEmpty()];
