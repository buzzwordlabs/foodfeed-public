import express from 'express';
import { admin } from '../../controllers';
import {
  getPostValidator,
  deletePostValidator,
  getPostsForUserValidator
} from './validators';
import { validationResultMiddleware } from '../../utils';

const postsRouter = express.Router();

postsRouter.get(
  '/user',
  getPostsForUserValidator,
  validationResultMiddleware,
  admin.posts.getPostsForUser
);

postsRouter.get(
  '/',
  getPostValidator,
  validationResultMiddleware,
  admin.posts.getPost
);

postsRouter.delete(
  '/',
  deletePostValidator,
  validationResultMiddleware,
  admin.posts.deletePost
);

postsRouter.post(
  '/ban',
  deletePostValidator,
  validationResultMiddleware,
  admin.posts.banPost
);

export default postsRouter;
