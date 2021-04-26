import express from 'express';
import { user } from '../../controllers';
import { validationResultMiddleware } from '../../utils';
import { contactMobileValidator } from './validators';

const contactRouter = express.Router();

contactRouter.post(
  '/',
  contactMobileValidator,
  validationResultMiddleware,
  user.contact.sendContactEmailMobile
);

export default contactRouter;
