import express from 'express';
import { contact } from '../controllers';
import { validationResultMiddleware } from '../utils';
import { contactFormValidator, recaptchaValidator } from './validators';

const contactRouter = express.Router();

contactRouter.post(
  '/form',
  contactFormValidator,
  validationResultMiddleware,
  contact.sendContactEmailWeb
);

contactRouter.post(
  '/recaptcha',
  recaptchaValidator,
  validationResultMiddleware,
  contact.verifyRecaptcha
);

export default contactRouter;
