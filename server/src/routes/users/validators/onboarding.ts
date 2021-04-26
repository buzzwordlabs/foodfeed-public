import { body } from 'express-validator';

export const onboardingStepValidator = [body('onboardingStep').not().isEmpty()];

export const nameGenderValidator = [
  body('firstName').isString().trim().not().isEmpty(),
  body('lastName').isString().trim().not().isEmpty(),
  body('gender').not().isEmpty().isString().isIn(['M', 'F', 'O', 'U'])
];
