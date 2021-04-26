import { callsCallHistoryValidator } from './validators';

import express from 'express';
import { user } from '../../controllers';
import { validationResultMiddleware } from '../../utils';

const callRouter = express.Router();

callRouter.put(
  '/history',
  callsCallHistoryValidator,
  validationResultMiddleware,
  user.calls.updateCallHistory
);

export default callRouter;
