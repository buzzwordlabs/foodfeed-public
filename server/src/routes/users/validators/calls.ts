import { body } from 'express-validator';

export const callsCallHistoryValidator = [body('callId').not().isEmpty()];
