import express from 'express';
import { followingValidator } from './validators';
import { user } from '../../controllers';
import { validationResultMiddleware } from '../../utils';

const followerRouter = express.Router();

followerRouter.get(
  '/other-followers',
  followingValidator('query'),
  validationResultMiddleware,
  user.followers.getUserFollowers
);
followerRouter.get(
  '/other-following',
  followingValidator('query'),
  validationResultMiddleware,
  user.followers.getUserFollowing
);

followerRouter.get(
  '/following-status',
  followingValidator('query'),
  validationResultMiddleware,
  user.followers.getFollowingStatus
);

followerRouter.post(
  '/',
  followingValidator('body'),
  validationResultMiddleware,
  user.followers.startFollowing
);

followerRouter.delete(
  '/',
  followingValidator('body'),
  validationResultMiddleware,
  user.followers.stopFollowing
);

export default followerRouter;
