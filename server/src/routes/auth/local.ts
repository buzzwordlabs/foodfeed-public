import { signinValidator, signupValidator } from './validators';

import { auth } from '../../controllers';
import express from 'express';
import { validationResultMiddleware } from '../../utils';

const localAuthRouter = express.Router();

localAuthRouter.post(
  '/signup',
  signupValidator,
  validationResultMiddleware,
  auth.local.signup
);

localAuthRouter.post(
  '/signin',
  signinValidator,
  validationResultMiddleware,
  auth.local.signin
);

export default localAuthRouter;
