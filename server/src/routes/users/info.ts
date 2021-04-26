import express from 'express';
import { user } from '../../controllers';
import { userInfoValidator } from './validators';
import { validationResultMiddleware } from '../../utils';

const infoRouter = express.Router();

infoRouter.post(
  '/',
  userInfoValidator,
  validationResultMiddleware,
  user.info.updateInfo
);

export default infoRouter;
