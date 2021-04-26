import { nameGenderValidator, onboardingStepValidator } from './validators';

import express from 'express';
import { user } from '../../controllers';
import { validationResultMiddleware } from '../../utils';

const onboardingRouter = express.Router();

onboardingRouter.get('/step', user.onboarding.getCurrentStep);

onboardingRouter.post(
  '/step',
  onboardingStepValidator,
  validationResultMiddleware,
  user.onboarding.stepChange
);

onboardingRouter.post(
  '/name-gender',
  nameGenderValidator,
  validationResultMiddleware,
  user.onboarding.nameGender
);

export default onboardingRouter;
