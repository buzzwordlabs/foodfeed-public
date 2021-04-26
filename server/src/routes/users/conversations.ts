import express from 'express';
import { user } from '../../controllers';
import { validationResultMiddleware } from '../../utils';
import {} from './validators';
import { reactMessageValidator } from './validators/conversations';

const conversationsRouter = express.Router();

conversationsRouter.get(
  '/search',
  user.conversations.searchPossibleConversations
);

conversationsRouter.get(
  '/message/react',
  reactMessageValidator,
  validationResultMiddleware,
  user.conversations.getReactionsMessages
);

conversationsRouter.delete('/', user.conversations.deleteConversation);

export default conversationsRouter;
