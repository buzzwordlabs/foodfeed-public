import ua from 'universal-analytics';
import { REACT_APP_GOOGLE_ANALYTICS_ID } from '../config';

export const analytics = ua(REACT_APP_GOOGLE_ANALYTICS_ID!);
