import express, { NextFunction, Request, Response } from 'express';
import posts from './posts';
import users from './users';
import { FOODFEED_ADMIN_API_TOKEN } from '../../config';

const adminRouter = express.Router();

adminRouter.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.sendStatus(401);
    const token = header.split(' ')[1];
    if (token === FOODFEED_ADMIN_API_TOKEN) {
      next();
    } else {
      return res.sendStatus(401);
    }
  } catch (err) {
    return res.sendStatus(401);
  }
});

adminRouter.use('/users', users);

adminRouter.use('/posts', posts);

export default adminRouter;
