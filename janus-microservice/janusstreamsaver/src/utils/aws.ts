import AWS from 'aws-sdk';
import {
  AWS_ACCESS_KEY_ID,
  AWS_ACCESS_KEY_SECRET,
  IS_PRODUCTION
} from '../config';

const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_ACCESS_KEY_SECRET
});

const S3_BUCKET = IS_PRODUCTION ? 'foodfeed-production' : 'foodfeed-staging';

const S3_USER_STREAM_RECORDING_KEY_FOLDER = 'user-stream-recording';

const deleteFromS3Bucket = async (url: string) => {
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

export {
  s3,
  S3_BUCKET,
  deleteFromS3Bucket,
  S3_USER_STREAM_RECORDING_KEY_FOLDER
};
