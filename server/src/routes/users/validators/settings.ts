import { body } from 'express-validator';
import { USERNAME_VALIDATOR, PASSWORD_REGEX } from '../../../utils';

export const updateUsernameValidator = [USERNAME_VALIDATOR];
export const deleteAccountValidator = [
  body('password').matches(PASSWORD_REGEX),
  body('reason').not().isEmpty().isString()
];

export const modifyBlockListValidator = [body('blockedUsers').not().isEmpty()];
