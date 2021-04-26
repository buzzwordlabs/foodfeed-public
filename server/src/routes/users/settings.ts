import {
  S3_USER_AVATAR_KEY_FOLDER,
  uploadUtilUser,
  validationResultMiddleware
} from '../../utils';
import { deleteAccountValidator, modifyBlockListValidator } from './validators';

import express from 'express';
import { user } from '../../controllers';

const settingsRouter = express.Router();

settingsRouter.get('/account', user.settings.getUserInfo);

settingsRouter.put(
  '/account',
  uploadUtilUser(S3_USER_AVATAR_KEY_FOLDER).single('avatar'),
  user.settings.updateAccountSettings
);

settingsRouter.delete(
  '/account',
  deleteAccountValidator,
  validationResultMiddleware,
  user.settings.deleteAccount
);

// TODO turn on when we want this
// settingsRouter.put(
//   '/username',
//   updateUsernameValidator,
//   validationResultMiddleware,
//   user.settings.updateUsername
// );

settingsRouter.get('/blocklist', user.settings.getBlocklist);

settingsRouter.put(
  '/blocklist',
  modifyBlockListValidator,
  validationResultMiddleware,
  user.settings.modifyBlocklist
);

export default settingsRouter;
