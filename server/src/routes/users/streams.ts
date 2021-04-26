import {
  S3_USER_STREAM_THUMBNAIL_KEY_FOLDER,
  uploadUtilUser,
  validationResultMiddleware
} from '../../utils';

import express from 'express';
import { user } from '../../controllers';
import { getPageValidator, getPageBodyValidator } from './validators';

const streamsRouter = express.Router();

streamsRouter.post(
  '/thumbnail',
  uploadUtilUser(S3_USER_STREAM_THUMBNAIL_KEY_FOLDER).single('thumbnail'),
  user.streams.uploadThumbnail
);

streamsRouter.get(
  '/',
  getPageValidator,
  validationResultMiddleware,
  user.streams.getListOfStreams
);

streamsRouter.post(
  '/viewers',
  getPageBodyValidator,
  validationResultMiddleware,
  user.streams.getListOfViewers
);

export default streamsRouter;
