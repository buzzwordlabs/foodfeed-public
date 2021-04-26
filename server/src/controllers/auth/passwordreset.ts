import asyncHandler from 'express-async-handler';
import { sendEmail, pgPool } from '../../utils';
import { random } from 'lodash';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';

export const sendResetPasswordEmail = async (token: number, email: string) => {
  const mailOptions = {
    to: email,
    subject: 'FoodFeed - Reset Password',
    html:
      `If you requested a password reset for your account, please enter the six-digit code below.<br/><br/>` +
      `This will expire in 5 minutes.<br/><br/>` +
      `${token}<br/><br/>` +
      `If you did not request this, please ignore this email and your password will remain unchanged.`
  };
  return sendEmail(mailOptions);
};

export const passwordResetEmail = asyncHandler(async (req, res, _next) => {
  const { email } = req.body;
  const user = await db.sql<
    s.users.SQL,
    Pick<
      s.users.Selectable,
      'id' | 'resetPasswordToken' | 'resetPasswordExpires'
    >[]
  >`SELECT ${'id'}, ${'resetPasswordToken'}, ${'resetPasswordExpires'}
    FROM ${'users'}
    WHERE ${'email'} = ${db.param(email)}
    AND ${'banned'} = ${db.param(false)}`.run(pgPool);
  if (user.length === 0) return res.sendStatus(401);

  const token = random(100000, 999999);
  await db.sql<s.users.SQL>`
    UPDATE ${'users'}
    SET ${'resetPasswordToken'} = ${db.param(
    token
  )}, ${'resetPasswordExpires'} = ${db.param(new Date(Date.now() + 60 * 5000))}
    WHERE ${'id'} = ${db.param(user[0].id)}`.run(pgPool);
  await sendResetPasswordEmail(token, email);
  return res.sendStatus(200);
});

export const passwordResetToken = asyncHandler(async (req, res, _next) => {
  const { token, email }: { token: number; email: string } = req.body;
  const user = await db.sql<
    s.users.SQL,
    Pick<s.users.Selectable, 'resetPasswordExpires'>[]
  >`SELECT ${'resetPasswordExpires'}
    FROM ${'users'}
    WHERE ${'email'} = ${db.param(
    email
  )} AND ${'resetPasswordToken'} = ${db.param(
    token
  )} AND ${'banned'} = ${db.param(false)}`.run(pgPool);
  if (user.length === 0) return res.sendStatus(401);
  if (
    !user[0].resetPasswordExpires ||
    new Date(user[0].resetPasswordExpires) < new Date()
  ) {
    return res.sendStatus(401);
  }
  return res.sendStatus(200);
});

export const passwordReset = asyncHandler(async (req, res, _next) => {
  const {
    token,
    password,
    email
  }: { token: number; password: string; email: string } = req.body;
  const user = await db.sql<
    s.users.SQL,
    Pick<s.users.Selectable, 'id' | 'resetPasswordExpires'>[]
  >`SELECT ${'id'}, ${'resetPasswordExpires'}
    FROM ${'users'}
    WHERE ${'email'} = ${db.param(
    email
  )} AND ${'resetPasswordToken'} = ${db.param(
    token
  )} AND ${'banned'} = ${db.param(false)}`.run(pgPool);

  if (user.length === 0) return res.sendStatus(401);
  if (
    !user[0].resetPasswordExpires ||
    new Date(user[0].resetPasswordExpires) < new Date()
  ) {
    await db.sql<s.users.SQL>`
    UPDATE ${'users'}
    SET ${'resetPasswordToken'} = NULL, ${'resetPasswordExpires'} = NULL
    WHERE ${'id'}=${db.param(user[0].id)}`.run(pgPool);
    return res.sendStatus(401);
  }
  await db.sql<s.users.SQL>`
  UPDATE ${'users'}
  SET ${'password'} = crypt(${db.param(
    password
  )}, gen_salt('bf', 12)) ${'resetPasswordToken'} = NULL, ${'resetPasswordExpires'} = NULL
  WHERE ${'id'}=${db.param(user[0].id)}`.run(pgPool);
  return res.sendStatus(200);
});
