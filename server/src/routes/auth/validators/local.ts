import { USERNAME_VALIDATOR, PASSWORD_REGEX } from '../../../utils';
import { body } from 'express-validator';
import dayjs from 'dayjs';

export const signupValidator = [
  body('email', 'Invalid email').isEmail().normalizeEmail(),
  body('password', 'Password must be 8+ characters').matches(PASSWORD_REGEX),
  body('birthdate', 'User must be 13 or older.')
    .not()
    .isEmpty()
    .customSanitizer((value) => new Date(dayjs(value).format())),
  body('birthdateUTC', 'User must be 13 or older.').custom((value) => {
    if (!value) return false;
    const age = dayjs().diff(value, 'year');
    if (age >= 13) {
      return true;
    } else {
      return false;
    }
  }),
  body('deviceInfo').not().isEmpty(),
  USERNAME_VALIDATOR
];

export const signinValidator = [
  body('usernameOrEmail', 'Invalid username, email, or password')
    .not()
    .isEmpty()
    .isString()
    .trim()
    .customSanitizer((value) => value.toLowerCase()),
  body('password', 'Invalid username, email, or password').matches(
    PASSWORD_REGEX
  ),
  body('deviceInfo').not().isEmpty()
];
