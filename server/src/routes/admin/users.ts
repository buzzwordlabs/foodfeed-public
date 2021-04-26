import express from 'express';
import { admin } from '../../controllers';
import { banValidator } from './validators';
import { validationResultMiddleware } from '../../utils';

const userRouter = express.Router();

userRouter.post(
  '/ban',
  banValidator,
  validationResultMiddleware,
  admin.users.banUser
);

export default userRouter;
