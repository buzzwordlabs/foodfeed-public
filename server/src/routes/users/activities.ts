import express from 'express';
import { user } from '../../controllers';

const activityRouter = express.Router();

activityRouter.get('/', user.activities.getActivities);

activityRouter.delete('/', user.activities.deleteActivity);

activityRouter.delete('/all', user.activities.clearAllActivities);

export default activityRouter;
