export interface ConversationSendMessageData {
  conversationId: string;
  message: string;
}

export interface ConversationDeleteMessageData {
  conversationId: string;
  messageId: string;
}

export interface ConversationReactMessagedata {
  conversationId: string;
  messageId: string;
  reaction: string;
}

export interface GetConversationsData {
  page: number;
  pageSize: number;
}

export interface GetConversationData {
  page: number;
  pageSize: number;
  conversationId: string;
}

export interface ConversationReadMessageData {
  conversationId: string;
  messageId: string;
}
