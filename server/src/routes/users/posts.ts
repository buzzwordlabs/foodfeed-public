import express from 'express';
import { user } from '../../controllers';
import {
  validationResultMiddleware,
  uploadUtilUser,
  S3_USER_POST_MEDIA_KEY_FOLDER
} from '../../utils';
import {
  getPostsValidator,
  getPostValidator,
  editPostValidator,
  deletePostValidator,
  likePostValidator,
  getLikesValidator,
  getCommentsValidator,
  makeorEditCommentValidator,
  deleteCommentValidator
} from './validators';

const postsRouter = express.Router();

postsRouter.get(
  '/',
  getPostsValidator,
  validationResultMiddleware,
  user.posts.getPosts
);

postsRouter.post(
  '/',
  uploadUtilUser(S3_USER_POST_MEDIA_KEY_FOLDER).array('media', 7),
  user.posts.createPost
);

postsRouter.put(
  '/',
  editPostValidator,
  validationResultMiddleware,
  user.posts.editPost
);

postsRouter.delete(
  '/',
  deletePostValidator,
  validationResultMiddleware,
  user.posts.deletePost
);

postsRouter.get(
  '/reactions',
  getLikesValidator,
  validationResultMiddleware,
  user.posts.getReactionsUsers
);

postsRouter.post(
  '/react',
  likePostValidator,
  validationResultMiddleware,
  user.posts.reactToPost
);

postsRouter.get(
  '/post',
  getPostValidator,
  validationResultMiddleware,
  user.posts.getPost
);

postsRouter.get(
  '/comments',
  getCommentsValidator,
  validationResultMiddleware,
  user.posts.getComments
);

postsRouter.post(
  '/comment',
  makeorEditCommentValidator,
  validationResultMiddleware,
  user.posts.makeComment
);

postsRouter.put(
  '/comment',
  makeorEditCommentValidator,
  validationResultMiddleware,
  user.posts.editComment
);

postsRouter.delete(
  '/comment',
  deleteCommentValidator,
  validationResultMiddleware,
  user.posts.deleteComment
);

export default postsRouter;
