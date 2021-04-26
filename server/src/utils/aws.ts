import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import shortid from 'shortid';
import {
  AWS_ACCESS_KEY_ID,
  AWS_ACCESS_KEY_SECRET,
  IS_PRODUCTION
} from '../config';

export const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_ACCESS_KEY_SECRET
});

export const S3_BUCKET = IS_PRODUCTION
  ? 'foodfeed-production'
  : 'foodfeed-staging';

export const S3_USER_AVATAR_KEY_FOLDER = 'user-avatar';

export const S3_USER_STREAM_THUMBNAIL_KEY_FOLDER = 'user-stream-thumbnail';

export const S3_USER_POST_MEDIA_KEY_FOLDER = 'user-post-media';

export const deleteFromS3Bucket = async (url: string) => {
  if (url.includes(S3_BUCKET)) {
    const key = url.split('/').reverse().slice(0, 2).reverse().join('/');
    await s3
      .deleteObject({
        Bucket: S3_BUCKET,
        Key: key
      })
      .promise();
  }
};

export const uploadUtilUser = (folderName: string) =>
  multer({
    storage: multerS3({
      s3,
      bucket: S3_BUCKET,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key(_req, file, cb) {
        cb(null, `${folderName}/${shortid.generate()}${file.originalname}`);
      }
    })
  });
