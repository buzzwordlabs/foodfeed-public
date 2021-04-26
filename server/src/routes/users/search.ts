import {
  profileValidator,
  searchAccountsValidator,
  historyValidator
} from './validators';

import express from 'express';
import { user } from '../../controllers';
import { validationResultMiddleware } from '../../utils/expressValidator';

const searchRouter = express.Router();

searchRouter.get(
  '/accounts',
  searchAccountsValidator,
  validationResultMiddleware,
  user.search.accounts
);
searchRouter.get(
  '/profile/:username',
  profileValidator,
  validationResultMiddleware,
  user.search.profile
);
searchRouter.get(
  '/callHistory/:username',
  historyValidator,
  validationResultMiddleware,
  user.search.callHistory
);
searchRouter.get(
  '/streamHistory/:username',
  historyValidator,
  validationResultMiddleware,
  user.search.streamHistory
);

searchRouter.get(
  '/postHistory/:username',
  historyValidator,
  validationResultMiddleware,
  user.search.postHistory
);
export default searchRouter;
