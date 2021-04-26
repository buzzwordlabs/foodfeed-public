import {
  IS_PRODUCTION,
  NODE_ENV,
  TRELLO_TECHNICAL_ISSUE_LIST_ID
} from './config';
import express, { Express, NextFunction, Request, Response } from 'express';
import { logger, trello } from './utils';

import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { faq, contact } from './routes';

const APPLE_APP_SITE_ASSOCIATION_PATH = path.join(
  __dirname,
  '../static',
  'apple-app-site-association'
);

export const configureExpress = (app: Express) => {
  app.set('trust proxy', 2);
  app.use(
    express.urlencoded({
      extended: true
    })
  );
  app.use(express.json());
  app.use(helmet());
  app.use(
    morgan(
      NODE_ENV !== 'production'
        ? 'dev'
        : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :response-time ms :res[content-length] ":referrer" ":user-agent"'
    )
  );

  // error handler, express expects 4 parameters
  app.use(
    async (err: Error, _req: Request, res: Response, _next: NextFunction) => {
      try {
        res.sendStatus(500);
        logger.error('Express Error Handler', err);
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
  app.get(
    '/.well-known/apple-app-site-association',
    (_req: Request, res: Response) => {
      res.set('Content-Type', 'application/json');
      res.status(200).sendFile(APPLE_APP_SITE_ASSOCIATION_PATH);
    }
  );
  app.get('/apple-app-site-association', (_req: Request, res: Response) => {
    res.set('Content-Type', 'application/json');
    res.status(200).sendFile(APPLE_APP_SITE_ASSOCIATION_PATH);
  });
  app.use(
    '/.well-known/assetlinks.json',
    express.static(path.join(__dirname, '../static', 'assetlinks.json'))
  );
  app.use(
    express.static(
      path.resolve(
        __dirname,
        IS_PRODUCTION ? '../static/build' : '../../static/build'
      )
    )
  );

  [
    '/',
    '/about',
    '/faq',
    '/contact',
    '/privacy-policy',
    '/terms-of-service'
  ].forEach((route) => {
    app.get(route, (_req: Request, res: Response) => {
      res.sendFile(
        path.resolve(
          __dirname,
          IS_PRODUCTION ? '../static/build' : '../../static/build',
          'index.html'
        )
      );
    });
  });
  app.use('/contacts', contact);
  app.use('/faqs', faq);
  app.get('/health', (_req, res) => {
    res.sendStatus(200);
  });
  // app.get(
  //   '*',
  //   deeplink({
  //     url: `https://foodfeed.live`,
  //     fallback: IS_PRODUCTION
  //       ? 'https://foodfeed.live'
  //       : `https://localhost:${PORT}`,
  //     android_package_name: 'com.buzzwordlabs.foodfeed',
  //     ios_store_link:
  //       'https://apps.apple.com/us/app/foodfeed-live-food-streaming/id1514843947'
  //   })
  // );
};
