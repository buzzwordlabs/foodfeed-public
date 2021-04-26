import asyncHandler from 'express-async-handler';
import * as db from '../zapatos/src';
import * as s from '../zapatos/schema';
import { pgPool } from '../utils';

export const getFaqs = asyncHandler(async (_req, res, _next) => {
  const faq = await db.sql<
    s.faqs.SQL,
    Pick<s.faqs.Selectable, 'question' | 'answer'>[]
  >`SELECT ${'question'}, ${'answer'} FROM ${'faqs'}`.run(pgPool);
  return res.status(200).json({ faq });
});
