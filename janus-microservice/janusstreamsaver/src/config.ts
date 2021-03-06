const {
  NODE_ENV = 'dev',
  FOODFEED_EMAIL_ADDRESS,
  FOODFEED_CRASHES_EMAIL,
  FOODFEED_GMAIL_REFRESH_TOKEN,
  GAUTH_CLIENT_SECRET,
  AWS_ACCESS_KEY_ID,
  AWS_ACCESS_KEY_SECRET,
  REACT_APP_GAUTH_CLIENTID,
  DATABASE_URL
} = process.env;

const IS_PRODUCTION = NODE_ENV === 'production';

const envs = [
  NODE_ENV,
  IS_PRODUCTION,
  FOODFEED_EMAIL_ADDRESS,
  FOODFEED_CRASHES_EMAIL,
  AWS_ACCESS_KEY_ID,
  AWS_ACCESS_KEY_SECRET,
  FOODFEED_GMAIL_REFRESH_TOKEN,
  GAUTH_CLIENT_SECRET,
  REACT_APP_GAUTH_CLIENTID,
  DATABASE_URL
];

if (!envs.every((env) => env !== undefined)) {
  throw new Error('Some environment variables are undefined');
}

export {
  NODE_ENV,
  IS_PRODUCTION,
  FOODFEED_EMAIL_ADDRESS,
  AWS_ACCESS_KEY_ID,
  AWS_ACCESS_KEY_SECRET,
  FOODFEED_CRASHES_EMAIL,
  FOODFEED_GMAIL_REFRESH_TOKEN,
  GAUTH_CLIENT_SECRET,
  REACT_APP_GAUTH_CLIENTID,
  DATABASE_URL
};
