import React, { useContext, useEffect, useState, useRef } from "react";
import {
  ThemeContext,
  GlobalContext,
  ConversationContext,
  SocketContext,
  SocketReceiveNewMessage,
  SocketReceiveMessageReaction,
  SocketReceiveMessageRead,
} from "../../contexts";
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  BackHandler,
} from "react-native";
import { shadowBoxTop, tintColor, window } from "../../constants";
import {
  LoadingIndicator,
  ChatTextInput,
  Icon,
  Avatar,
  SlideUp,
  SlideUpButton,
  DoubleTap,
  ViewUsersListSlideUp,
  Text,
  GoBackButton,
  TextButton,
  UnblockUserSlideUp,
} from "../../components";
import {
  formatMessageDate,
  PaginationState,
  defaultPaginationState,
  cleanOutgoingText,
  PostReactionsStringIndexed,
  PostReactionStringOptions,
  scrollToEnd,
  showBanner,
} from "../../utils";
import { isEmpty } from "lodash";
import { ConversationsStackNavProps } from "../../navigation";
import { useKeyboard, useSlideUp, useModal } from "../../hooks";
import { isIphoneX } from "../../constants/statusBar";
import Clipboard from "@react-native-community/clipboard";
import { ConversationEventListenersEnum } from "../../contexts/events";

interface Props extends ConversationsStackNavProps<"Conversation"> {}

interface ConversationParticipant {
  username: string;
  avatar: string;
  firstName: string;
  lastName: string;
  banned: boolean;
  blockedBy: boolean;
  isBlocked: boolean;
}

interface ConversationData {
  participants: ConversationParticipant[];
  messages: ConversationMessage[];
}

export interface ConversationMessageReaction {
  reaction: PostReactionStringOptions;
  count: number;
  reacted: boolean;
}

interface ConversationReadStatuses {
  username: string;
  avatar: string;
  read: boolean;
}

export interface ConversationMessage {
  id: string;
  message: string;
  createdAt: string;
  username: string;
  avatar: string;
  readStatuses: ConversationReadStatuses[];
  sent: boolean;
  reactions: ConversationMessageReaction[];
}

interface State extends ConversationData, PaginationState {
  error: boolean;
}

const initialConversationData: State = {
  ...defaultPaginationState,
  participants: [],
  messages: [],
  error: false,
};

const Conversation = (props: Props) => {
  const { backgroundColor, borderColor } = useContext(ThemeContext);
  const global = useContext(GlobalContext);
  const conversationContext = useContext(ConversationContext);
  const socketContext = useContext(SocketContext);
  const [state, setState] = useState(initialConversationData);
  const [focusedMessageIndex, setFocusedMessageIndex] = useState<null | number>(
    null
  );

  const [messageInput, setMessageInput] = useState("");
  const [keyboardShown, keyboardHeight] = useKeyboard();

  const [
    unblockUserRef,
    openUnblockUserSlideUp,
    closeUnblockUserSlideUp,
  ] = useSlideUp();
  const [
    longPressMessageOptionsRef,
    openLongPressMessageOptions,
    closeLongPressMessageOptions,
  ] = useSlideUp();
  const [
    conversationOptionsRef,
    openConversationOptions,
    closeConversationOptions,
  ] = useSlideUp();
  const [seeMembersRef, openSeeMembers, closeSeeMembers] = useSlideUp();

  const { openModal, closeModal } = useModal();

  const isCurrentUser = (username: string) =>
    username === global.state.username;

  const otherParticipants = state.participants.filter(
    (p) => !isCurrentUser(p.username)
  );
  const otherParticipantsLength = otherParticipants.length;

  props.navigation.setOptions({
    headerTitle: () => {
      return (
        <TouchableOpacity
          onPress={() => {
            if (otherParticipantsLength > 0) {
              props.navigation.push("UneditableProfile", {
                username: otherParticipants[0].username,
              });
            }
          }}
        >
          <Text w="bold">
            {otherParticipantsLength > 0
              ? `${otherParticipants[0].username}${
                  otherParticipantsLength > 1
                    ? ` ${otherParticipantsLength - 1} others`
                    : ""
                }`
              : ""}
          </Text>
        </TouchableOpacity>
      );
    },
    headerRight: () =>
      !state.error && !state.initLoading ? (
        <TouchableOpacity onPress={openConversationOptions}>
          <Icon library="materialComIcons" name="dots-horizontal" size={32} />
        </TouchableOpacity>
      ) : null,
    headerLeft: () => <GoBackButton onPress={props.navigation.popToTop} />,
  });

  const initConversationSocketListeners = () => {
    socketContext.turnOnConversationListener(
      ConversationEventListenersEnum.conversation_new_message,
      socketReceiveNewMessage
    );
    socketContext.turnOnConversationListener(
      ConversationEventListenersEnum.conversation_message_reacted,
      socketReceiveMessageReaction
    );
    socketContext.turnOnConversationListener(
      ConversationEventListenersEnum.conversation_other_message_read,
      socketReceiveMessageRead
    );
    socketContext.turnOnConversationListener(
      ConversationEventListenersEnum.conversation_blocked_by_other_participant,
      socketBlockedByOtherParticipant
    );
    socketContext.turnOnConversationListener(
      ConversationEventListenersEnum.conversation_unblocked_by_other_participant,
      socketUnblockedByOtherParticipant
    );
  };

  const cleanupConversationSocketListeners = () => {
    socketContext.turnOffConversationListener(
      ConversationEventListenersEnum.conversation_new_message,
      socketReceiveNewMessage
    );
    socketContext.turnOffConversationListener(
      ConversationEventListenersEnum.conversation_message_reacted,
      socketReceiveMessageReaction
    );
    socketContext.turnOffConversationListener(
      ConversationEventListenersEnum.conversation_other_message_read,
      socketReceiveMessageRead
    );
    socketContext.turnOffConversationListener(
      ConversationEventListenersEnum.conversation_blocked_by_other_participant,
      socketBlockedByOtherParticipant
    );
    socketContext.turnOffConversationListener(
      ConversationEventListenersEnum.conversation_unblocked_by_other_participant,
      socketUnblockedByOtherParticipant
    );
  };

  useEffect(() => {
    initConversationSocketListeners();
    (async () => initLoad())();

    BackHandler.addEventListener("hardwareBackPress", () => {
      props.navigation.popToTop();
      return true;
    });

    return cleanupConversationSocketListeners;
  }, []);

  const socketReceiveMessageReaction: SocketReceiveMessageReaction = ({
    messageId,
    reaction,
    set,
  }) => {
    setState((prevState) => {
      const messagesCopy = prevState.messages;
      const { foundMessage } = findMessage(messagesCopy, messageId);
      if (foundMessage) {
        const { foundReaction } = findReaction(
          foundMessage.reactions,
          reaction
        );
        if (foundReaction) {
          foundReaction.count = foundReaction.count + (set ? 1 : -1);
        } else {
          foundMessage.reactions.unshift({ reaction, reacted: true, count: 1 });
        }
        return { ...prevState, messages: messagesCopy };
      }
      return prevState;
    });
  };

  const socketBlockedByOtherParticipant = ({
    username,
  }: {
    username: string;
  }) => {
    setState(({ participants, ...prevState }) => ({
      ...prevState,
      participants: participants.map((participant) => {
        if (participant.username === username) {
          participant.blockedBy = true;
        }
        return participant;
      }),
    }));
  };

  const socketUnblockedByOtherParticipant = ({
    username,
  }: {
    username: string;
  }) => {
    setState(({ participants, ...prevState }) => ({
      ...prevState,
      participants: participants.map((participant) => {
        if (participant.username === username) {
          participant.blockedBy = false;
        }
        return participant;
      }),
    }));
  };

  const socketReceiveNewMessage: SocketReceiveNewMessage = (
    receivedMessage
  ) => {
    setState(({ messages, ...prevState }) => ({
      ...prevState,
      messages: [receivedMessage, ...messages],
      page: Math.ceil((messages.length + 1) / prevState.pageSize),
    }));
    conversationContext.readMessage({
      conversationId: receivedMessage.conversationId,
      messageId: receivedMessage.id,
    });
  };

  const socketReceiveMessageRead: SocketReceiveMessageRead = ({ username }) => {
    setState((prevState) => {
      const prevMessages = prevState.messages;
      const mostRecentMessageByCurrentUserIndex = getMostRecentMessageIndexByUsername(
        global.state.username,
        prevMessages
      );
      const message = prevMessages[mostRecentMessageByCurrentUserIndex];
      const newReadStatuses = message.readStatuses.map((rs) => {
        if (rs.username === username) rs.read = true;
        return rs;
      });
      message.readStatuses = newReadStatuses;
      prevMessages.splice(mostRecentMessageByCurrentUserIndex, 1, message);
      return { ...prevState, messages: prevMessages };
    });
  };

  const findMessage = (messages: ConversationMessage[], messageId: string) => {
    const foundMessageIndex = messages.findIndex((m) => m.id === messageId);
    const foundMessage: ConversationMessage | undefined =
      messages[foundMessageIndex];
    return { foundMessageIndex, foundMessage };
  };

  const findReaction = (
    reactions: ConversationMessageReaction[],
    reactionString: PostReactionStringOptions
  ) => {
    const foundReactionIndex = reactions.findIndex(
      (r) => r.reaction === reactionString
    );
    const foundReaction: ConversationMessageReaction | undefined =
      reactions[foundReactionIndex];
    return { foundReactionIndex, foundReaction };
  };

  const initLoad = async () => {
    const data = await conversationContext.getConversation({
      page: state.page,
      pageSize: state.pageSize,
      conversationId: props.route.params.conversationId,
    });
    return setState({
      ...state,
      ...data.conversation,
      page: data.page + 1,
      reachedEnd: data.reachedEnd,
      initLoading: false,
    });
  };

  const paginate = async () => {
    if (state.reachedEnd || state.paginationLoading) return;
    setState((prevState) => ({ ...prevState, paginationLoading: true }));
    const data = await conversationContext.getMessages({
      page: state.page,
      pageSize: state.pageSize,
      conversationId: props.route.params.conversationId,
    });
    return setState(({ messages, ...prevState }) => ({
      ...prevState,
      messages: [...messages, ...data.messages],
      page: data.page + 1,
      reachedEnd: data.reachedEnd,
      paginationLoading: false,
    }));
  };

  const ListFooterComponent = () => {
    if (state.paginationLoading) {
      return <LoadingIndicator style={{ marginVertical: 20 }} />;
    }
    if (state.reachedEnd && state.messages.length > state.pageSize) {
      return (
        <Text a="center" w="bold" style={{ marginVertical: 20 }}>
          You've reached the 🔚
        </Text>
      );
    }
  };

  const getMostRecentMessageIndexByUsername = (
    username: string,
    messages: ConversationMessage[]
  ) => {
    return messages.findIndex((m) => m.username === username);
  };

  const submitMessage = async () => {
    const [cleanedMessage, errorReason] = cleanOutgoingText({
      text: messageInput,
      minimumLength: 1,
    });
    if (errorReason) return;

    const sentMessage = await conversationContext.sendMessage({
      message: cleanedMessage,
      conversationId: props.route.params.conversationId,
    });

    setMessageInput("");
    setState(({ messages, ...prevState }) => ({
      ...prevState,
      messages: [sentMessage, ...messages],
    }));
  };

  const onPressAvatar = (username: string) => {
    props.navigation.push("UneditableProfile", { username });
  };

  const copyMessage = async () => {
    Clipboard.setString(state.messages[focusedMessageIndex as number].message);
    await Clipboard.getString();
    closeLongPressMessageOptions();
  };

  const seeMembers = () => {
    openSeeMembers();
    closeConversationOptions();
  };

  const onPressReactionItem = (
    index: number,
    reaction: PostReactionStringOptions
  ) => {
    if (index || index === 0) {
      addMessageReaction(index, reaction);
    } else {
      // No index provided
    }
  };

  const onPressMessageLong = () => {
    openLongPressMessageOptions();
  };

  const onPressMessageDouble = async (
    index: number,
    reaction: PostReactionStringOptions = "like"
  ) => {
    addMessageReaction(index, reaction);
  };

  const addMessageReaction = (
    messageIndex: number,
    reaction: PostReactionStringOptions
  ) => {
    setState((prevState) => {
      const messagesCopy = prevState.messages;
      const foundMessage = messagesCopy[messageIndex];
      if (foundMessage) {
        const foundReactionIndex = foundMessage.reactions.findIndex((r) => {
          if (r.reaction === reaction) {
            return r;
          }
        });

        const foundReaction = foundMessage.reactions[foundReactionIndex];

        if (foundReaction) {
          foundMessage.reactions[
            foundReactionIndex
          ].reacted = foundReaction.reacted ? false : true;
          foundMessage.reactions[foundReactionIndex].count =
            foundMessage.reactions[foundReactionIndex].count +
            (foundReaction.reacted ? 1 : -1);
        } else {
          foundMessage.reactions.unshift({ reaction, reacted: true, count: 1 });
        }

        messagesCopy.splice(messageIndex, 1, foundMessage);
        conversationContext.reactMessage({
          conversationId: props.route.params.conversationId,
          messageId: foundMessage.id,
          reaction,
        });
        return { ...prevState, messages: messagesCopy };
      }
      return prevState;
    });
  };

  const submitUnblockUser = async (username: string) => {
    await conversationContext.unblockParticipant({
      conversationId: props.route.params.conversationId,
      username,
    });
    setState((prevState) => {
      const participants = prevState.participants.map((p) => {
        if (p.username === username) p.isBlocked = false;
        return p;
      });
      return { ...prevState, participants };
    });
  };

  const submitBlockUser = async (username: string) => {
    await conversationContext.blockParticipant({
      conversationId: props.route.params.conversationId,
      username,
    });
    setState((prevState) => {
      const participants = prevState.participants.map((p) => {
        if (p.username === username) p.isBlocked = true;
        return p;
      });
      return { ...prevState, participants };
    });
  };

  const openUnblockModal = () => {
    openModal("UnblockModal", {
      submit: submitUnblockUser,
      username: otherParticipants?.[0].username,
      onSuccessCallback: onSuccessUnblockUser,
      onFailCallback: onFailUnblockUser,
    });
  };

  const openBlockModal = () => {
    openModal("BlockModal", {
      submit: submitBlockUser,
      username: otherParticipants?.[0].username,
      onSuccessCallback: onSuccessBlockUser,
      onFailCallback: onFailBlockUser,
    });
  };

  const onSuccessUnblockUser = () => {
    // TODO: Do whatever is necessary to change UI and let the world know
  };

  const onFailUnblockUser = () => {
    showBanner({ message: "An erorr occurred.", type: "danger" });
  };

  const onSuccessBlockUser = () => {
    // TODO: Do whatever is necessary to change UI and let the world know
  };

  const onFailBlockUser = () => {
    showBanner({ message: "An erorr occurred.", type: "danger" });
  };

  const participantsWithOnlineStatuses = state.participants.map((p) => ({
    ...p,
    isOnline: undefined,
  }));

  const mostRecentIndexMap: { [username: string]: number } = {};

  state.participants.forEach((p) => {
    mostRecentIndexMap[p.username] = state.messages.findIndex(
      (m) => m.username === p.username
    );
  });

  const firstOtherUser = state.participants.find(
    (p) => p.username !== global.state.username
  )?.username as string;

  const currentUserBlocked = otherParticipants[0]?.isBlocked;
  const currentUserBlockedBy = otherParticipants[0]?.blockedBy;
  const anyBlocked = currentUserBlocked || currentUserBlockedBy;

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <View style={{ flex: 1 }}>
        {state.initLoading ? (
          <LoadingIndicator style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            inverted
            data={state.messages}
            keyExtractor={(_item: any, index: number) => index.toString()}
            ListFooterComponent={ListFooterComponent()}
            onEndReachedThreshold={0.01}
            onEndReached={paginate}
            renderItem={({ item, index }) => {
              return (
                <>
                  {index === 0 && anyBlocked && (
                    <View
                      style={{
                        alignSelf: "center",
                        paddingBottom: 10,
                        paddingTop: 10,
                        marginBottom: 20,
                        marginTop: 10,
                        marginHorizontal: 10,
                        paddingHorizontal: 10,
                        borderColor,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderRadius: 6,
                      }}
                    >
                      <Text w="semiBold">
                        You have{" "}
                        {currentUserBlockedBy ? "been blocked by" : "blocked"}{" "}
                        {firstOtherUser || "this person"}. You can still read
                        past messages, but you cannot receive or send any
                        messages until{" "}
                        {currentUserBlockedBy
                          ? "they unblock you"
                          : "you unblock them"}
                        .
                      </Text>
                    </View>
                  )}
                  <ConversationMessageEl
                    {...item}
                    index={index}
                    isMostRecentMessageByUser={
                      mostRecentIndexMap[item.username] === index
                    }
                    nextMessage={state.messages[index - 1]}
                    onPressAvatar={onPressAvatar}
                    onPressMessageLong={onPressMessageLong}
                    onPressMessageDouble={
                      anyBlocked ? async (_) => {} : onPressMessageDouble
                    }
                    onPressReactionItem={
                      anyBlocked ? () => {} : onPressReactionItem
                    }
                    setFocusedMessageIndex={setFocusedMessageIndex}
                  />
                </>
              );
            }}
          />
        )}
      </View>
      <View
        style={{
          paddingBottom: keyboardShown ? keyboardHeight : isIphoneX() ? 20 : 0,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor,
          ...shadowBoxTop,
        }}
      >
        {anyBlocked ? (
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.8)",
              paddingVertical: 25,
              paddingHorizontal: 15,
            }}
          >
            <View style={{ flexDirection: "row" }}>
              {currentUserBlocked ? (
                <>
                  <TextButton
                    title="Unblock"
                    textProps={{ w: "bold", t: "highlight" }}
                    onPress={openUnblockModal}
                  />
                  <Text a="center" w="bold">
                    {" "}
                    {"user"} to send messages to them again.
                  </Text>
                </>
              ) : currentUserBlockedBy ? (
                <Text a="center" w="bold">
                  You were blocked by {otherParticipants[0]?.username}
                </Text>
              ) : (
                <></>
              )}
            </View>
          </View>
        ) : (
          <ChatTextInput
            showWordCount={keyboardShown}
            submit={submitMessage}
            onChangeText={setMessageInput}
            value={messageInput}
            maxLength={1000}
            textInputStyle={{ fontSize: 16 }}
            textInputProps={{ editable: !anyBlocked }}
          />
        )}
      </View>
      <SlideUp ref={longPressMessageOptionsRef} withHandle={false}>
        <SlideUpButton type="copy" onPress={copyMessage} />
        {!anyBlocked && (
          <SlideUpButton
            type={"like"}
            onPress={() => {
              closeLongPressMessageOptions();
              if (
                (focusedMessageIndex || focusedMessageIndex === 0) &&
                !anyBlocked
              ) {
                if (state.messages[focusedMessageIndex].reactions)
                  onPressReactionItem(focusedMessageIndex, "like");
              }
            }}
          />
        )}
        <SlideUpButton type="close" onPress={closeLongPressMessageOptions} />
      </SlideUp>
      <SlideUp ref={conversationOptionsRef} withHandle={false}>
        <SlideUpButton type="info" title="See Members" onPress={seeMembers} />
        {otherParticipantsLength === 1 &&
          !currentUserBlockedBy &&
          (currentUserBlocked ? (
            <SlideUpButton
              type="unblock"
              onPress={() => {
                closeConversationOptions();
                openUnblockModal();
              }}
            />
          ) : (
            <SlideUpButton
              type="block"
              onPress={() => {
                closeConversationOptions();
                openBlockModal();
              }}
            />
          ))}
        <SlideUpButton type="close" onPress={closeConversationOptions} />
      </SlideUp>
      <ViewUsersListSlideUp
        ref={seeMembersRef}
        onCancel={closeSeeMembers}
        users={participantsWithOnlineStatuses}
        onPressProfileItem={({ username }) => {
          closeSeeMembers();
          props.navigation.push("UneditableProfile", { username });
        }}
      />
    </View>
  );
};

interface ConversationMessageElProps extends ConversationMessage {
  index: number;
  isMostRecentMessageByUser: boolean;
  nextMessage: ConversationMessage;
  onPressAvatar: (username: string) => void;
  onPressMessageLong: () => void;
  onPressMessageDouble: (index: number) => Promise<void>;
  setFocusedMessageIndex: (index: number) => void;
  onPressReactionItem: (
    index: number,
    reaction: PostReactionStringOptions
  ) => void;
}

const ConversationMessageEl = (props: ConversationMessageElProps) => {
  const global = useContext(GlobalContext);
  const {
    liftedBackgroundColor,
    focusedActionButtonBackgroundColor,
    focusedActionButtonTextColor,
    borderColor,
  } = useContext(ThemeContext);

  const reactionsRef: any = useRef(null);

  useEffect(() => {
    scrollToEnd(reactionsRef, 0);
  }, []);

  const isCurrentUser = (username: string) =>
    username === global.state.username;

  const onPressAvatar = () => props.onPressAvatar(props.username);

  const onPressMessageLong = () => {
    props.setFocusedMessageIndex(props.index);
    props.onPressMessageLong();
  };

  const onPressMessageDouble = () => props.onPressMessageDouble(props.index);

  const currentUserSent = isCurrentUser(props.username);
  // For other users, only show avatar next to most recent message in chunk
  let isMostRecentByOtherInGroup = false;
  if (!currentUserSent) {
    let currentSearchIndex = props.index - 1;
    while (true) {
      const isLastMessageInList = isEmpty(props.nextMessage);
      const nextMessageSentByOther =
        props.nextMessage?.username === props.username;
      currentSearchIndex = currentSearchIndex - 1;
      if (isLastMessageInList) {
        isMostRecentByOtherInGroup = true;
        break;
      } else {
        if (!nextMessageSentByOther) isMostRecentByOtherInGroup = true;
        break;
      }
    }
  }

  const anyoneRead = props.readStatuses?.some(
    (s) => !isCurrentUser(s.username) && s.read === true
  );

  return (
    <View
      style={{
        flexDirection: isMostRecentByOtherInGroup ? "row" : "column",
        marginVertical: 3,
        marginBottom: props.index === 0 ? 10 : 0,
      }}
    >
      {isMostRecentByOtherInGroup && (
        <TouchableOpacity
          style={{ alignSelf: "flex-end" }}
          onPress={onPressAvatar}
        >
          <Avatar
            style={{
              width: 35,
              height: 35,
              marginLeft: 10,
              marginBottom: props.reactions.length > 0 ? 20 : 0,
            }}
            avatar={props.avatar}
          />
        </TouchableOpacity>
      )}
      <DoubleTap
        onLongPress={onPressMessageLong}
        onPressDouble={onPressMessageDouble}
        style={{
          maxWidth: "70%",
          minWidth: "40%",
          paddingVertical: 14,
          marginVertical: 2,
          marginRight: 10,
          marginLeft: isMostRecentByOtherInGroup ? 10 : 55,
          marginBottom: props.reactions.length > 0 ? 20 : 0,
          paddingBottom: props.reactions.length > 0 ? 25 : 14,
          paddingHorizontal: 15,
          borderRadius: 10,
          alignSelf: currentUserSent ? "flex-end" : "flex-start",
          backgroundColor: currentUserSent
            ? focusedActionButtonBackgroundColor
            : liftedBackgroundColor,
        }}
      >
        <Text style={{ color: focusedActionButtonTextColor }} w="semiBold">
          {props.message}
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <View>
            <Text
              style={{ color: focusedActionButtonTextColor }}
              s="xs"
              w="semiBold"
            >
              {formatMessageDate(props.createdAt)}
            </Text>
          </View>
          {props.sent && (
            <View style={{ marginLeft: 10 }}>
              <Text
                style={{ color: focusedActionButtonTextColor }}
                s="xs"
                w="semiBold"
              >
                ✓
              </Text>
            </View>
          )}
        </View>
        <View
          style={{
            position: "absolute",
            bottom: -15,
            maxWidth: window.width * 0.7,
            minWidth: window.width * 0.4,
            flexDirection: "row",
            zIndex: 1,
          }}
        >
          {props.reactions.map((r, key) => {
            if (r.reaction === "like")
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => props.onPressReactionItem(props.index, "like")}
                  style={[
                    {
                      borderWidth: 1,
                      borderColor: r.reacted ? tintColor : borderColor,
                      borderRadius: 8,
                      backgroundColor: liftedBackgroundColor,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      marginRight: 10,
                      flexDirection: "row",
                    },
                    currentUserSent ? { left: 5 } : { right: 5 },
                  ]}
                >
                  <Text s="sm">
                    {PostReactionsStringIndexed["like"]} {r.count}
                  </Text>
                </TouchableOpacity>
              );
          })}
        </View>
      </DoubleTap>
      {anyoneRead && props.isMostRecentMessageByUser && currentUserSent && (
        <View
          style={{
            flexDirection: "row",
            alignSelf: "flex-end",
            alignItems: "center",
            marginRight: 20,
            marginVertical: 10,
          }}
        >
          {props.readStatuses.map(
            (rs, key) =>
              rs.read &&
              !isCurrentUser(rs.username) && (
                <Avatar
                  key={key}
                  avatar={rs.avatar}
                  style={{ width: 20, height: 20, marginRight: 3 }}
                />
              )
          )}
          <View style={{ marginLeft: 5 }}>
            <Text w="bold" s="sm">
              Read
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default Conversation;
