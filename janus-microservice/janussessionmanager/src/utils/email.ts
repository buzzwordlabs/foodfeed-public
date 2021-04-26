import nodemailer from 'nodemailer';
import { logger } from '.';
import {
  FOODFEED_EMAIL_ADDRESS,
  FOODFEED_GMAIL_REFRESH_TOKEN,
  GAUTH_CLIENT_SECRET,
  REACT_APP_GAUTH_CLIENTID,
  IS_PRODUCTION
} from '../config';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    type: 'OAuth2',
    user: FOODFEED_EMAIL_ADDRESS,
    clientId: REACT_APP_GAUTH_CLIENTID,
    clientSecret: GAUTH_CLIENT_SECRET,
    refreshToken: FOODFEED_GMAIL_REFRESH_TOKEN
  }
});

interface Email {
  to?: string;
  from?: string;
  subject: string;
  html: string;
  attachments?: { filename: string; path: string }[];
}

const sendEmail = async ({
  subject,
  html,
  from = `'Food Feed' <${FOODFEED_EMAIL_ADDRESS}>`,
  to = FOODFEED_EMAIL_ADDRESS,
  attachments = []
}: Email) => {
  const mailOptions = { from, to, subject, html, attachments };
  if (IS_PRODUCTION) {
    try {
      const result = await transporter.sendMail(mailOptions);
      result.ok = result.response.split(' ').includes('OK');
      return result;
    } catch (err) {
      return err;
    }
  } else {
    logger.info(
      JSON.stringify({ from, to, subject, html, attachments }, null, 2)
    );
  }
};

export { sendEmail };
