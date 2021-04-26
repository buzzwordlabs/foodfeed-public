import nodemailer from 'nodemailer';
import { logger } from '.';
import {
  FOODFEED_EMAIL_ADDRESS,
  FOODFEED_GMAIL_REFRESH_TOKEN,
  GAUTH_CLIENT_SECRET,
  IS_PRODUCTION,
  REACT_APP_GAUTH_CLIENTID
} from '../config';
import * as s from '../zapatos/schema';

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

interface UserInfo {
  user: s.users.Selectable;
  deviceInfo: s.users_devices.Selectable;
}

export const extractUserInfo = (userInfo: UserInfo) => {
  return `
    UserId: ${userInfo?.user?.id}<br></br>
    First Name: ${userInfo?.user?.firstName}<br></br>
    Last Name: ${userInfo?.user?.lastName}<br></br>
    Email: ${userInfo?.user?.email}<br></br>
    Device Info: ${JSON.stringify(userInfo?.deviceInfo, null, 2)}<br></br>
  `;
};

export const sendEmail = async ({
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
