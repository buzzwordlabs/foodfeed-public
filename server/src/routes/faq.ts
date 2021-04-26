import express from 'express';
import { faq } from '../controllers';

const faqRouter = express.Router();

faqRouter.get('/', faq.getFaqs);

export default faqRouter;
