import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { pgPool } from '../../utils';
import asyncHandler from 'express-async-handler';

export const initialTopics = asyncHandler(async (req, res, _next) => {
  const {
    topics = []
  }: {
    topics: (s.topics.Insertable & { selected: boolean })[];
    onboardingStep: s.users.Insertable['onboardingStep'];
  } = req.body;
  if (topics.length > 0) {
    const userTopics: s.users_topics.Insertable[] = topics
      .filter((topic) => topic.selected)
      .map((topic) => ({
        topicId: topic.id as string,
        userId: req.user.id
      }));
    await db.insert('users_topics', userTopics).run(pgPool);
  }
  await db.sql<s.users.SQL>`
  UPDATE ${'users'} SET ${'onboardingStep'} = ${db.param(0)}
  WHERE ${'id'} = ${db.param(req.user.id)}`.run(pgPool);
  return res.sendStatus(200);
});

export const getTopicsList = asyncHandler(async (_req, res, _next) => {
  const topics = await db.sql<
    s.topics.SQL,
    s.topics.Selectable[]
  >`SELECT * FROM ${'topics'} LIMIT 30`.run(pgPool);
  return res.status(200).json({ topics });
});
