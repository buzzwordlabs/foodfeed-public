import asyncHandler from 'express-async-handler';
import {
  IS_PRODUCTION,
  TRELLO_SUPPORT_TICKET_LIST_ID,
  FOODFEED_SUPPORT_EMAIL
} from '../../config';
import { sendEmail, trello } from '../../utils';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { pgPool } from '../../utils';

export const sendContactEmailMobile = asyncHandler(async (req, res, next) => {
  const { message, reason, deviceInfo } = req.body;
  const user = await db.sql<
    s.users.SQL,
    Pick<s.users.Selectable, 'firstName' | 'lastName' | 'email'>[]
  >`SELECT ${'firstName'}, ${'lastName'}, ${'email'} FROM ${'users'}
  WHERE ${'id'} = ${db.param(req.user.id)}`.run(pgPool);
  if (user.length === 0) return res.sendStatus(401);

  const emailResponse = await sendEmail({
    subject: `FoodFeed ${reason}`,
    from: FOODFEED_SUPPORT_EMAIL,
    to: FOODFEED_SUPPORT_EMAIL,
    html: `
      Message from: ${user[0].firstName} ${user[0].lastName}<br></br>
      UserId: ${req.user.id}<br></br>
      Email: ${user[0].email}<br></br>
      Device Info: ${JSON.stringify(deviceInfo, null, 2)}<br></br>
      Message: ${message}
    `
  });
  if (IS_PRODUCTION) {
    await trello.card.create({
      name: `${user[0].firstName} ${user[0].lastName} ${reason}`,
      desc: `
    Message from: ${user[0].firstName} ${user[0].lastName}
    UserId: ${req.user.id}
    Email: ${user[0].email}
    Device Info: ${JSON.stringify(deviceInfo)}
    Message: ${message}
    `,
      pos: 'top',
      idList: TRELLO_SUPPORT_TICKET_LIST_ID
    });
  }
  if (emailResponse instanceof Error) {
    return next(emailResponse);
  }
  return res.sendStatus(200);
});
