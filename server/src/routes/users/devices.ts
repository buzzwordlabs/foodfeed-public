import { deviceTokenValidator } from './validators';
import express from 'express';
import { user } from '../../controllers';
import { validationResultMiddleware } from '../../utils';

const deviceRouter = express.Router();

deviceRouter.post(
  '/token',
  deviceTokenValidator,
  validationResultMiddleware,
  user.devices.deviceToken
);

export default deviceRouter;
