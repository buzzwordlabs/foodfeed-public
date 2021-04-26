import { body } from 'express-validator';
import { PASSWORD_REGEX } from '../../../utils';
export const passwordResetEmailValidator = [
  body('email', 'Invalid email').isEmail().normalizeEmail()
];
export const passwordResetTokenValidator = [
  body('token', 'Invalid code or email')
    .isNumeric()
    .isLength({ min: 6, max: 6 }),
  // this intentionally shows the message obscurely to the frontend
  body('email', 'Invalid code').isEmail()
];

export const passwordResetValidator = [
  body('token', 'Invalid code').isNumeric().isLength({ min: 6, max: 6 }),
  body('password', "Password doesn't meet requirements").matches(
    PASSWORD_REGEX
  ),
  // this intentionally shows the message obscurely to the frontend
  body('email', 'Invalid code').isEmail()
];
