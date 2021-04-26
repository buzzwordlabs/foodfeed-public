import express from 'express';
import { user } from '../../controllers';

const topicsRouter = express.Router();

topicsRouter.post('/', user.topics.initialTopics);

topicsRouter.get('/', user.topics.getTopicsList);

export default topicsRouter;
