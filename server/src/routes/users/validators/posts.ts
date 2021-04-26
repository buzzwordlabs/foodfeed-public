import { body, query } from 'express-validator';

export const getPostsValidator = [
  query('page', 'Only numbers allowed for page.').optional().isNumeric(),
  query('pageSize', 'Only numbers allowed for pageSize.').optional().isNumeric()
];

export const editPostValidator = [
  body('id').not().isEmpty(),
  body('description').isLength({ min: 0, max: 2000 })
];

export const deletePostValidator = [body('id').not().isEmpty()];

export const likePostValidator = [body('id').not().isEmpty()];

export const getLikesValidator = [query('id').not().isEmpty()];

export const getPostValidator = [query('id').not().isEmpty().isString()];

export const getCommentsValidator = [
  query('id').not().isEmpty().isString(),
  query('page', 'Only numbers allowed for page.').optional().isNumeric(),
  query('pageSize', 'Only numbers allowed for pageSize.').optional().isNumeric()
];

export const makeorEditCommentValidator = [
  body('id').not().isEmpty().isString(),
  body('comment').isLength({ min: 0, max: 300 })
];

export const deleteCommentValidator = [query('id').not().isEmpty().isString()];
