import {
  IS_PRODUCTION,
  NODE_ENV,
  TRELLO_TECHNICAL_ISSUE_LIST_ID
} from './config';
import { auth, faq, user, admin } from './routes';
import express, { Express, NextFunction, Request, Response } from 'express';
import { logger, trello } from './utils';

import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

export const configureExpress = (app: Express) => {
  app.use(cors());
  app.set('trust proxy', 2);
  app.use(
    express.urlencoded({
      extended: true
    })
  );
  app.use(express.json());
  app.use(helmet());
  morgan.token('user-id', (req: any) => req.user?.id);
  app.use(
    morgan(
      NODE_ENV !== 'production'
        ? 'dev'
        : ':user-id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :response-time ms :res[content-length] ":referrer" ":user-agent"'
    )
  );

  // error handler, express expects 4 parameters
  app.use(
    async (err: Error, _req: Request, res: Response, _next: NextFunction) => {
      try {
        res.sendStatus(500);
        logger.error('Express error handler', err);
        if (IS_PRODUCTION) {
          await trello.card.create({
            name: 'Express Server Error Handler',
            desc: `${err.stack || err.message || err}`,
            pos: 'top',
            idList: TRELLO_TECHNICAL_ISSUE_LIST_ID
          });
        }
      } catch (err) {
        logger.error('EXPRESS ERROR HANDLER FAILURE', err);
      }
    }
  );
  app.use('/auth', auth);
  app.use('/user', user);
  app.use('/faq', faq);
  app.use('/toolsforfoodfeedadmins', admin);
  app.get('/health', (_req, res) => {
    res.sendStatus(200);
  });
};
