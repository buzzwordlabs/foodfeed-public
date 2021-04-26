import { blockUserValidator, reportUserValidator } from './validators';

import express from 'express';
import { user } from '../../controllers';
import { validationResultMiddleware } from '../../utils';

const tattleRouter = express.Router();

tattleRouter.post(
  '/report',
  reportUserValidator,
  validationResultMiddleware,
  user.tattle.reportUser
);

tattleRouter.post(
  '/block',
  blockUserValidator,
  validationResultMiddleware,
  user.tattle.addToBlocklist
);

tattleRouter.delete(
  '/unblock',
  blockUserValidator,
  validationResultMiddleware,
  user.tattle.removeFromBlocklist
);

export default tattleRouter;
