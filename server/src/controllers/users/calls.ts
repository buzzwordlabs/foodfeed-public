import asyncHandler from 'express-async-handler';
import { customServerErrorResponse } from '../../utils';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { pgPool } from '../../utils';

export const updateCallHistory = asyncHandler(async (req, res, _next) => {
  const {
    callId,
    rating,
    description
  }: {
    callId: s.call_history.Selectable['id'];
    rating: s.call_rating_enum;
    description: string;
  } = req.body;
  const callHistory = await db.sql<
    s.call_history.SQL,
    Pick<
      s.call_history.Selectable,
      | 'callerId'
      | 'callerRating'
      | 'callerRatingDescription'
      | 'calleeId'
      | 'calleeRating'
      | 'calleeRatingDescription'
    >[]
  >`SELECT ${'callerId'}, ${'callerRating'}, ${'callerRatingDescription'}, ${'calleeId'}, ${'calleeRating'}, ${'calleeRatingDescription'}
    FROM ${'call_history'}
    WHERE ${'id'} = ${db.param(callId)}`.run(pgPool);
  if (callHistory.length > 0) {
    if (callHistory[0].callerId === req.user.id) {
      await db.sql<s.call_history.SQL>`
      UPDATE ${'call_history'}
      SET ${'callerRating'} = ${db.param(
        rating
      )}, ${'callerRatingDescription'} = ${db.param(description)}
      WHERE ${'id'} = ${db.param(callId)}`.run(pgPool);
    } else if (callHistory[0].calleeId === req.user.id) {
      await db.sql<s.call_history.SQL>`
      UPDATE ${'call_history'}
      SET ${'calleeRating'} = ${db.param(
        rating
      )}, ${'calleeRatingDescription'} = ${db.param(description)}
      WHERE ${'id'} = ${db.param(callId)}`.run(pgPool);
    }
    return res.sendStatus(200);
  }
  return res.sendStatus(400).json(
    customServerErrorResponse({
      key: 'callId',
      message: 'No call with that Call ID found'
    })
  );
});
