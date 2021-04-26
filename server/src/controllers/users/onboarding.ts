import { analytics } from '../../utils';
import asyncHandler from 'express-async-handler';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { pgPool } from '../../utils';

export const getCurrentStep = asyncHandler(async (req, res, _next) => {
  const user = await db.sql<
    s.users.SQL,
    Pick<s.users.Selectable, 'onboardingStep'>[]
  >`SELECT ${'onboardingStep'} FROM ${'users'}
  WHERE ${'id'} = ${db.param(req.user.id)}`.run(pgPool);
  if (user.length === 0) return res.sendStatus(401);
  return res.status(200).json({ onboardingStep: user[0].onboardingStep });
});

export const stepChange = asyncHandler(async (req, res, _next) => {
  const {
    onboardingStep
  }: { onboardingStep: s.users.Selectable['onboardingStep'] } = req.body;
  const user = await db.sql<
    s.users.SQL,
    Pick<s.users.Selectable, 'onboardingStep'>[]
  >`SELECT ${'onboardingStep'} FROM ${'users'}
  WHERE ${'id'} = ${db.param(req.user.id)}`.run(pgPool);
  if (user.length === 0) return res.sendStatus(401);

  await db.sql<s.users.SQL>`
  UPDATE ${'users'} SET ${'onboardingStep'} = ${db.param(onboardingStep)}
  WHERE ${'id'} = ${db.param(req.user.id)}`.run(pgPool);
  if (onboardingStep === 0) {
    analytics.event('Onboarding', 'Completed Onboarding').send();
  }
  return res.sendStatus(200);
});

export const nameGender = asyncHandler(async (req, res, _next) => {
  const {
    firstName,
    lastName,
    gender
  }: {
    firstName: s.users.Selectable['firstName'];
    lastName: s.users.Selectable['lastName'];
    gender: s.users_gender_enum;
  } = req.body;

  await db.sql<s.users.SQL>`
  UPDATE ${'users'}
  SET ${'firstName'} = ${db.param(firstName)}, ${'lastName'} = ${db.param(
    lastName
  )}, ${'gender'} = ${db.param(gender)}, ${'onboardingStep'} = ${db.param(2)}
  WHERE ${'id'} = ${db.param(req.user.id)}`.run(pgPool);
  return res.sendStatus(200);
});
