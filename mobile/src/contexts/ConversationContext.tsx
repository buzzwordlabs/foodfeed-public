import React, { Component, useContext, useState, useEffect } from "react";
import {
  showBanner,
  bugsnagBreadcrumb,
  AMPLITUDE_TRANSACTIONAL_EVENTS,
  amplitudeTrack,
  PostReactionEmojisOptions,
  PostReactionStringOptions,
} from "../utils";

import { SocketContext } from "./SocketContext";
import { ConversationEventListenersEnum } from "./events";
import { BadgeContext } from "./BadgeContext";
import {
  ConversationParticipant,
  ConversationPreviewMessage,
} from "../screens/Conversations/Conversations";
import { ConversationMessage } from "../screens/Conversations/Conversation";

type GetConversations = (params: { pageSize: number; page: number }) => any;

type SendMessage = (params: {
  message: string;
  conversationId: string;
}) => Promise<ConversationMessage>;

type GetConversation = (params: {
  pageSize: number;
  page: number;
  conversationId: string;
}) => any;

type CreateConversation = ({
  usernames,
}: {
  usernames: string[];
}) => Promise<{ conversationId: string }>;

type GetMessages = (params: {
  pageSize: number;
  page: number;
  conversationId: string;
}) => Promise<{
  page: number;
  pageSize: number;
  reachedEnd: boolean;
  messages: Message[];
}>;

export type SocketReceiveNewConversationMessage = (args: {
  conversationId: string;
  participants: ConversationParticipant[];
  message: ConversationPreviewMessage;
}) => void;

export type SocketReadConversationMessage = (args: {
  conversationId: string;
}) => void;

export type SocketReceiveNewMessage = (message: Message) => void;

export type SocketReceiveMessageReaction = (data: {
  conversationId: string;
  messageId: string;
  reaction: PostReactionStringOptions;
  // TODO: What is this?
  set: boolean;
}) => void;

export type ReadMessage = (messageInfo: {
  conversationId: string;
  messageId: string;
}) => void;

export type ReactMessage = (messageInfo: {
  conversationId: string;
  messageId: string;
  reaction: PostReactionStringOptions;
}) => void;

export type BlockParticipant = (info: {
  conversationId: string;
  username: string;
}) => Promise<void>;

export type UnBlockParticipant = (info: {
  conversationId: string;
  username: string;
}) => Promise<void>;

export type SocketReceiveMessageRead = (userInfo: { username: string }) => void;

type ContextProps = {
  state: State;
  resetState: () => void;
  setState: React.Dispatch<React.SetStateAction<State>>;
  cleanup: () => void;
  joinConversationRooms: () => void;
  getConversations: GetConversations;
  getConversation: GetConversation;
  sendMessage: SendMessage;
  createConversation: CreateConversation;
  getMessages: GetMessages;
  readMessage: ReadMessage;
  reactMessage: ReactMessage;
  blockParticipant: BlockParticipant;
  unblockParticipant: UnBlockParticipant;
};

type Message = any;

type SourceInformation = any;

const ConversationContext = React.createContext<ContextProps>(
  (null as unknown) as ContextProps
);

interface State {
  conversations: [];
}

const initialState: State = {
  conversations: [],
};

enum EmitEventsEnum {
  join_conversation_rooms = "join_conversation_rooms",
  get_unread_message_count = "get_unread_message_count",
  get_conversations = "get_conversations",
  get_conversation = "get_conversation",
  send_message = "send_message",
  get_messages = "get_messages",
  create_conversation = "create_conversation",
  read_message = "read_message",
  react_message = "react_message",
  block_participant = "block_participant",
  unblock_participant = "unblock_participant",
}

type EmitEvents = keyof typeof EmitEventsEnum;

type Props = {
  children: React.ReactNode;
};

const ConversationContextProvider = (props: Props) => {
  const socketContext = useContext(SocketContext);
  const {
    badgeStatusState,
    setBadgeStatusState,
    incrementBadgeStateProperty,
  } = useContext(BadgeContext);
  const [state, setState] = useState(initialState);
  const errorRetries: { [key in EmitEvents]: number } = {
    join_conversation_rooms: 0,
    get_unread_message_count: 0,
    get_conversations: 0,
    get_conversation: 0,
    send_message: 0,
    create_conversation: 0,
    get_messages: 0,
    read_message: 0,
    react_message: 0,
    block_participant: 0,
    unblock_participant: 0,
  };

  useEffect(() => {
    if (socketContext.state.socket) {
      initMessageSocketEvents();
    }
  }, [socketContext.state.socket]);

  const resetState = () => setState(initialState);

  const leaveRoom = () => {
    turnOffConversationSocketEvents();
  };

  const socketEmitStatusCb = (
    event: EmitEvents,
    successCb: (dataCb?: any) => any
  ) => (status: "ok" | "error", data?: any) => {
    if (status === "error") {
      amplitudeTrack(AMPLITUDE_TRANSACTIONAL_EVENTS.conversation_error, {
        event,
        description: "server_error",
      });
      errorHandler({ type: event });
    }
    if (status === "ok") {
      successCb(data);
    }
  };

  const emit = (event: EmitEvents, ...args: any[]) => {
    socketContext.socket?.emit(event, ...args);
  };

  const initMessageSocketEvents = () => {
    if (!socketContext) return;
    // TODO this may get removed
    emit(
      "join_conversation_rooms",
      socketEmitStatusCb("join_conversation_rooms", () => {})
    );

    socketContext.turnOnConversationListener(
      ConversationEventListenersEnum.conversation_message_deleted,
      messageDeleted
    );

    socketContext.turnOnConversationListener(
      ConversationEventListenersEnum.unread_messages_count,
      getUnreadMessagesCount
    );

    socketContext.turnOnConversationListener(
      ConversationEventListenersEnum.unread_messages_count_increment,
      getUnreadMessagesCountIncrement
    );

    socketContext.turnOnConversationListener(
      ConversationEventListenersEnum.unread_messages_count_decrement,
      getUnreadMessagesCountDecrement
    );

    emit(
      "get_unread_message_count",
      socketEmitStatusCb("get_unread_message_count", getUnreadMessagesCount)
    );
  };

  const turnOffConversationSocketEvents = () => {
    if (!socketContext) return;

    socketContext.turnOffConversationListener(
      ConversationEventListenersEnum.conversation_message_deleted,
      messageDeleted
    );

    socketContext.turnOffConversationListener(
      ConversationEventListenersEnum.unread_messages_count,
      getUnreadMessagesCount
    );

    socketContext.turnOffConversationListener(
      ConversationEventListenersEnum.unread_messages_count_increment,
      getUnreadMessagesCountIncrement
    );

    socketContext.turnOffConversationListener(
      ConversationEventListenersEnum.unread_messages_count_decrement,
      getUnreadMessagesCountDecrement
    );
  };

  const getUnreadMessagesCount = ({ count }: { count: number }) => {
    setBadgeStatusState({ ...badgeStatusState, conversations: count });
  };

  const getUnreadMessagesCountIncrement = () => {
    incrementBadgeStateProperty("conversations");
  };

  const getUnreadMessagesCountDecrement = () => {
    incrementBadgeStateProperty("conversations");
  };

  const joinConversationRooms = () => {
    emit(
      "join_conversation_rooms",
      socketEmitStatusCb("join_conversation_rooms", () => {})
    );
  };

  const getConversations: GetConversations = async (params) => {
    return new Promise((resolve, reject) => {
      emit(
        "get_conversations",
        params,
        socketEmitStatusCb("get_conversations", resolve)
      );
    });
  };

  const getConversation: GetConversation = async (params) => {
    return new Promise((resolve, reject) => {
      emit(
        "get_conversation",
        params,
        socketEmitStatusCb("get_conversation", resolve)
      );
    });
  };

  const getMessages: GetMessages = async (params) => {
    return new Promise((resolve, reject) => {
      emit("get_messages", params, socketEmitStatusCb("get_messages", resolve));
    });
  };

  const sendMessage: SendMessage = (data) => {
    return new Promise((resolve, reject) => {
      emit("send_message", data, socketEmitStatusCb("send_message", resolve));
    });
  };

  const createConversation: CreateConversation = (data) => {
    return new Promise((resolve, reject) => {
      emit(
        "create_conversation",
        data,
        socketEmitStatusCb("create_conversation", resolve)
      );
    });
  };

  const readMessage: ReadMessage = (messageInfo) => {
    emit(
      "read_message",
      messageInfo,
      socketEmitStatusCb("read_message", () => {})
    );
  };

  const reactMessage: ReactMessage = (messageInfo) => {
    emit(
      "react_message",
      messageInfo,
      socketEmitStatusCb("react_message", () => {})
    );
  };

  const blockParticipant: BlockParticipant = async (info) => {
    return new Promise((resolve, reject) => {
      emit(
        "block_participant",
        info,
        socketEmitStatusCb("block_participant", resolve)
      );
    });
  };

  const unblockParticipant: UnBlockParticipant = (info) => {
    return new Promise((resolve, reject) => {
      emit(
        "unblock_participant",
        info,
        socketEmitStatusCb("unblock_participant", resolve)
      );
    });
  };

  const messageDeleted = (data: {
    conversationId: string;
    messageId: string;
  }) => {};

  const cleanup = () => {};

  const assertUnreachable = (x: never): never => {
    throw new Error(
      "This case shouldn't be allowed in CallContext. Your error handler isn't account for all cases."
    );
  };

  const errorHandler = (data: { type: EmitEvents }) => {
    if (errorRetries[data.type] >= 3) {
      errorRetries[data.type] = 0;
      return;
    }
    if (errorRetries[data.type] === undefined) errorRetries[data.type] = 0;
    else errorRetries[data.type] = errorRetries[data.type] + 1;

    // TODO do any of these events need to do anything?
    switch (data.type) {
      case "join_conversation_rooms": {
        break;
      }
      case "get_unread_message_count": {
        break;
      }

      case "get_conversations": {
        break;
      }
      case "get_conversation": {
        break;
      }

      case "send_message": {
        break;
      }

      case "create_conversation": {
        break;
      }

      case "get_messages": {
        break;
      }

      case "read_message": {
        break;
      }

      case "react_message": {
        break;
      }

      case "block_participant": {
        break;
      }

      case "unblock_participant": {
        break;
      }

      default: {
        assertUnreachable(data.type);
      }
    }
  };

  return (
    <ConversationContext.Provider
      value={{
        state,
        resetState,
        setState,
        cleanup,
        joinConversationRooms,
        getConversations,
        getConversation,
        sendMessage,
        createConversation,
        getMessages,
        readMessage,
        reactMessage,
        blockParticipant,
        unblockParticipant,
      }}
    >
      {props.children}
    </ConversationContext.Provider>
  );
};

export { ConversationContext, ConversationContextProvider };
