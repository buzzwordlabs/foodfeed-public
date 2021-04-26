import { auth } from '../../controllers';
import express from 'express';
import {
  passwordResetEmailValidator,
  passwordResetTokenValidator,
  passwordResetValidator
} from './validators';
import { validationResultMiddleware } from '../../utils';

const passwordResetRouter = express.Router();

passwordResetRouter.post(
  '/',
  passwordResetEmailValidator,
  validationResultMiddleware,
  auth.passwordReset.passwordResetEmail
);

passwordResetRouter.post(
  '/token',
  passwordResetTokenValidator,
  validationResultMiddleware,
  auth.passwordReset.passwordResetToken
);

passwordResetRouter.post(
  '/reset',
  passwordResetValidator,
  validationResultMiddleware,
  auth.passwordReset.passwordReset
);

export default passwordResetRouter;
