import TrelloNodeAPI from 'trello-node-api';
import { TRELLO_API_KEY, TRELLO_API_TOKEN } from '../config';

export const trello = new TrelloNodeAPI();
trello.setApiKey(TRELLO_API_KEY!);
trello.setOauthToken(TRELLO_API_TOKEN!);
