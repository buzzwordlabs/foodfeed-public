import express, { NextFunction, Request, Response } from 'express';

import calls from './calls';
import contact from './contact';
import devices from './devices';
import followers from './followers';
import info from './info';
import { jwt, redis, refreshUserRedisPermission, pgPool } from '../../utils';
import onboarding from './onboarding';
import search from './search';
import settings from './settings';
import topics from './topics';
import streams from './streams';
import tattle from './tattle';
import auth from './auth';
import posts from './posts';
import activities from './activities';
import conversations from './conversations';
import { Payload } from '../../utils/jwt';
import * as db from '../../zapatos/src';

const userRouter = express.Router();

userRouter.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.sendStatus(401);
    const token = header.split(' ')[1];
    const verifiedToken: Payload = (await jwt.verify(token)) as any;
    const isAllowed = await redis.get(`${verifiedToken.id}-allowed`);
    if (isAllowed === 'true') {
      req.user = { id: verifiedToken.id };
      return next();
    } else if (isAllowed === 'false') {
      return res.sendStatus(403);
    } else {
      if (
        (await db
          .count('users', {
            id: verifiedToken.id,
            banned: false
          })
          .run(pgPool)) > 0
      ) {
        await refreshUserRedisPermission(verifiedToken.id, 'true');
        req.user = { id: verifiedToken.id };
        return next();
      } else {
        await refreshUserRedisPermission(verifiedToken.id, 'false');
        return res.sendStatus(403);
      }
    }
  } catch (err) {
    return res.sendStatus(401);
  }
});

userRouter.use('/topics', topics);

userRouter.use('/settings', settings);

userRouter.use('/devices', devices);

userRouter.use('/calls', calls);

userRouter.use('/tattle', tattle);

userRouter.use('/onboarding', onboarding);

userRouter.use('/contact', contact);

userRouter.use('/followers', followers);

userRouter.use('/info', info);

userRouter.use('/search', search);

userRouter.use('/streams', streams);

userRouter.use('/auth', auth);

userRouter.use('/posts', posts);

userRouter.use('/activities', activities);

userRouter.use('/conversations', conversations);

export default userRouter;
