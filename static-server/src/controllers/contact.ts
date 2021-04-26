import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { RECAPTCHA_SECRET_KEY, FOODFEED_SUPPORT_EMAIL } from '../config';
import { sendEmail } from '../utils';

const sendContactEmailWeb = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, message } = req.body;
    const emailResponse = await sendEmail({
      subject: 'FoodFeed Web Contact Form',
      html: `
      Message from: ${name}<br></br>
      Email: ${email}<br></br>
      Message: ${message}
    `,
      from: FOODFEED_SUPPORT_EMAIL,
      to: FOODFEED_SUPPORT_EMAIL
    });
    if (emailResponse instanceof Error) {
      return next(emailResponse);
    }
    return res.sendStatus(200);
  }
);

const verifyRecaptcha = asyncHandler(async (req, res, _next) => {
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${req.body.recaptcha}`
  );
  res.send(response.data);
});

export { sendContactEmailWeb, verifyRecaptcha, sendEmail };
