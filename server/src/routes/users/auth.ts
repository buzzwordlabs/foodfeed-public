import express from 'express';
import { validationResultMiddleware } from '../../utils';
import { logoutValidator } from './validators';
import { user } from '../../controllers';

const logoutRouter = express.Router();

logoutRouter.post(
  '/logout',
  logoutValidator,
  validationResultMiddleware,
  user.auth.logoutUser
);

export default logoutRouter;
