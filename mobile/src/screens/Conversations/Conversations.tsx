import React, { useContext, useState, useEffect } from "react";
import {
  ThemeContext,
  GlobalContext,
  ConversationContext,
  SocketContext,
  SocketReadConversationMessage,
  SocketReceiveNewConversationMessage,
} from "../../contexts";
import {
  View,
  TouchableOpacity,
  FlatList,
  Keyboard,
  RefreshControl,
  ViewStyle,
} from "react-native";
import {
  statusBarHeight,
  bottomTabBarOffset,
  tintColor,
} from "../../constants";
import {
  Text,
  Avatar,
  LoadingIndicator,
  Icon,
  SlideUp,
  SlideUpButton,
} from "../../components";
import {
  PaginationState,
  defaultPaginationState,
  popup,
  showBanner,
  formatMessageDate,
} from "../../utils";
import { useRequest, useSlideUp, useNavigationLock } from "../../hooks";
import { ConversationsStackNavProps } from "../../navigation";
import { BadgeContext } from "../../contexts/BadgeContext";
import { ConversationEventListenersEnum } from "../../contexts/events";
import { useScrollToTop } from "@react-navigation/native";

interface Props extends ConversationsStackNavProps<"Conversations"> {}

export interface ConversationParticipant {
  username: string;
  avatar: string;
  banned: boolean;
  blockedBy: boolean;
  isBlocked: boolean;
}

export interface ConversationPreviewMessage {
  id: string;
  message: string;
  createdAt: string;
  conversationId: string;
  read: boolean;
}

interface ConversationData {
  conversationId: string;
  participants: ConversationParticipant[];
  message: ConversationPreviewMessage;
}

interface State extends PaginationState {
  conversations: ConversationData[];
}

const initialState: State = {
  ...defaultPaginationState,
  conversations: [],
};

const Conversations = (props: Props) => {
  const [state, setState] = useState(initialState);
  const { backgroundColor, textColor } = useContext(ThemeContext);
  const conversationContext = useContext(ConversationContext);
  const socketContext = useContext(SocketContext);
  const [isLocked] = useNavigationLock();
  const ref = React.useRef(null);

  useScrollToTop(ref);

  const [request] = useRequest();

  useEffect(() => {
    if (props.route.params?.deepLinkScreen) {
      const { conversationId } = props.route.params;
      const screen = props.route.params?.deepLinkScreen;
      switch (screen) {
        case "Conversation":
          if (conversationId) {
            if (
              state.conversations.findIndex(
                (c) => c.conversationId === conversationId
              ) !== -1
            ) {
              props.navigation.push("Conversation", { conversationId });
              props.route.params.deepLinkScreen = undefined;
              props.route.params.conversationId = undefined;
            }
          }
          break;
      }
    }
  }, [props.route.params, state.conversations]);

  const initConversationSocketListeners = () => {
    socketContext.turnOnConversationListener(
      ConversationEventListenersEnum.conversations_new_message,
      socketReceiveNewConversationMessage
    );
    socketContext.turnOnConversationListener(
      ConversationEventListenersEnum.conversations_message_read,
      socketReadConversationMessage
    );
  };

  const cleanupConversationSocketListeners = () => {
    socketContext.turnOffConversationListener(
      ConversationEventListenersEnum.conversations_new_message,
      socketReceiveNewConversationMessage
    );
    socketContext.turnOffConversationListener(
      ConversationEventListenersEnum.conversations_message_read,
      socketReadConversationMessage
    );
  };

  useEffect(() => {
    initConversationSocketListeners();

    (async () => initLoad())();

    return cleanupConversationSocketListeners;
  }, []);

  const socketReceiveNewConversationMessage: SocketReceiveNewConversationMessage = (
    newConversation
  ) => {
    setState((prevState) => updateConversationList(newConversation, prevState));
  };

  /**
   * If newConversation already exists, updates it. Else, add it.
   */
  const updateConversationList = (
    newConversation: ConversationData,
    prevState: State
  ) => {
    const convoExists = prevState.conversations.findIndex(
      (convo) => convo.conversationId === newConversation.conversationId
    );
    if (convoExists === -1) {
      return {
        ...prevState,
        conversations: [newConversation, ...prevState.conversations],
        page: Math.ceil(
          (prevState.conversations.length + 1) / prevState.pageSize
        ),
      };
    }

    prevState.conversations.splice(convoExists, 1);
    return {
      ...prevState,
      conversations: [newConversation, ...prevState.conversations],
    };
  };

  const socketReadConversationMessage: SocketReadConversationMessage = ({
    conversationId,
  }) => {
    setState(({ conversations, ...prevState }) => ({
      ...prevState,
      conversations: updateReadOnSeenMessage(conversations, conversationId),
    }));
  };

  const updateReadOnSeenMessage = (
    conversations: ConversationData[],
    conversationId: string
  ) => {
    const index = conversations.findIndex(
      (c) => c.conversationId === conversationId
    );
    if (index === -1) return conversations;

    conversations[index].message.read = true;
    return conversations;
  };

  const initLoad = async () => {
    conversationContext.joinConversationRooms();
    const data = await conversationContext.getConversations({
      page: state.page,
      pageSize: state.pageSize,
    });

    return setState({
      ...state,
      page: data.page + 1,
      conversations: data.conversations,
      reachedEnd: data.reachedEnd,
      initLoading: false,
    });
  };

  const paginate = async () => {
    if (state.reachedEnd || state.paginationLoading) return;
    setState({ ...state, paginationLoading: true });
    const data = await conversationContext.getConversations({
      page: state.page,
      pageSize: state.pageSize,
    });
    return setState(({ conversations }) => ({
      ...state,
      conversations: [...conversations, ...data.conversations],
      page: data.page + 1,
      reachedEnd: data.reachedEnd,
      paginationLoading: false,
    }));
  };

  const refresh = async () => {
    setState((state) => ({ ...state, refreshing: true }));
    const data = await conversationContext.getConversations({
      page: 1,
      pageSize: state.pageSize,
    });
    setState((state) => ({
      ...state,
      page: data.page + 1,
      conversations: data.conversations,
      reachedEnd: data.reachedEnd,
      refreshing: false,
    }));
  };

  const onPressUsername = (username: string) => {
    isLocked() && props.navigation.push("UneditableProfile", { username });
  };

  const onPressConversation = (id: string, index: number) => {
    const foundConversation = state.conversations[index];
    if (foundConversation?.message.read === false)
      markConversationAsRead(index);
    isLocked() && props.navigation.push("Conversation", { conversationId: id });
  };

  const onPressCreateConversation = () => {
    isLocked() && props.navigation.push("CreateConversation");
  };

  const deleteConversation = async (index: number, conversationId: string) => {
    const response = await request({
      url: "user/conversations",
      method: "DELETE",
      body: { id: conversationId },
    });
    if (response.ok) {
      removeConversation(index);
    } else {
      showBanner({ message: "An erorr occurred.", type: "danger" });
    }
  };

  const markConversationAsRead = (index: number) => {
    setState((prevState) => {
      if (prevState.conversations[index].message.read === false) {
        prevState.conversations[index].message.read = true;
        return { ...prevState, conversations: prevState.conversations };
      }
      return prevState;
    });
  };

  const removeConversation = (index: number) => {
    setState((prevState) => {
      const conversationsCopy = prevState.conversations;
      if (conversationsCopy[index]) {
        conversationsCopy.splice(index, 1);
      }
      return { ...prevState, conversations: conversationsCopy };
    });
  };

  const ListEmptyComponent = () => {
    return state.initLoading ? (
      <LoadingIndicator style={{ marginTop: 40 }} />
    ) : (
      <Text a="center" w="bold" style={{ marginVertical: 20 }}>
        No conversations yet!
      </Text>
    );
  };

  const ListFooterComponent = () => {
    if (state.paginationLoading) {
      return (
        <LoadingIndicator
          style={{ marginTop: 20, marginBottom: bottomTabBarOffset + 50 }}
        />
      );
    }
    if (state.reachedEnd && state.conversations.length > state.pageSize) {
      return (
        <Text
          a="center"
          w="bold"
          style={{ marginTop: 20, marginBottom: bottomTabBarOffset + 50 }}
        >
          You've reached the 🔚
        </Text>
      );
    }
  };

  const RefreshControlComponent = () => {
    return (
      <RefreshControl
        refreshing={state.refreshing}
        onRefresh={refresh}
        tintColor={textColor}
      />
    );
  };

  return (
    <View
      style={{
        backgroundColor,
        flex: 1,
        paddingTop: statusBarHeight,
        paddingBottom: bottomTabBarOffset,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 20,
          paddingRight: 10,
          paddingBottom: 10,
        }}
      >
        <Text s="header" w="bold">
          Inbox
        </Text>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={{ padding: 7.5 }}
            onPress={onPressCreateConversation}
          >
            <Icon name="form" library="antdesign" size={24} />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        ref={ref}
        showsVerticalScrollIndicator={false}
        data={state.conversations}
        onScrollBeginDrag={Keyboard.dismiss}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        keyExtractor={(_item: any, index: number) => index.toString()}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={ListEmptyComponent()}
        refreshControl={RefreshControlComponent()}
        ListFooterComponent={ListFooterComponent()}
        onEndReached={paginate}
        renderItem={({ item, index }) => (
          <ConversationItem
            {...item}
            index={index}
            onPressConversation={onPressConversation}
            onPressUsername={onPressUsername}
            onPressMarkConversationAsRead={markConversationAsRead}
            onPressDeleteConversation={deleteConversation}
          />
        )}
      />
    </View>
  );
};

interface ConversationItemProps extends ConversationData {
  index: number;
  onPressConversation: (id: string, index: number) => void;
  onPressUsername: (username: string) => void;
  onPressMarkConversationAsRead: (index: number) => void;
  onPressDeleteConversation: (
    index: number,
    conversationId: string
  ) => Promise<void>;
}

const ConversationItem = (props: ConversationItemProps) => {
  if (!props?.message) return <></>;
  const { borderColor, backgroundColor } = useContext(ThemeContext);
  const global = useContext(GlobalContext);
  const [optionsRef, openOptions, closeOptions] = useSlideUp();

  const resolveUsernames = () => {
    const otherParticipants = props.participants.filter(
      (p) => p.username !== global.state.username
    );

    const otherParticipantsLength = otherParticipants.length;

    if (otherParticipantsLength > 0) {
      if (otherParticipantsLength === 1) {
        return <Text w="bold">{otherParticipants[0].username}</Text>;
      } else if (otherParticipantsLength === 2) {
        return (
          <View style={{ flexDirection: "row" }}>
            <Text w="bold">{otherParticipants[0].username}</Text>
            <Text w="bold"> and {otherParticipants[1].username}</Text>
          </View>
        );
      } else {
        return (
          <View style={{ flexDirection: "row" }}>
            <Text w="bold">{otherParticipants[0].username}</Text>
            <Text w="bold"> and {otherParticipants.length} others</Text>
          </View>
        );
      }
    }
  };

  const RenderSingleAvatar = ({
    avatar,
    style,
    width,
    height,
  }: {
    username: string;
    avatar: string;
    style?: ViewStyle;
    width?: number;
    height?: number;
  }) => {
    return (
      <View style={[{ paddingHorizontal: 10 }, style]}>
        <Avatar
          style={{ width: width || 45, height: height || 45 }}
          avatar={avatar}
        />
      </View>
    );
  };

  const resolveAvatars = () => {
    const otherParticipants = props.participants.filter(
      (p) => p.username !== global.state.username
    );
    const otherParticipantsLength = otherParticipants.length;

    if (otherParticipantsLength === 1) {
      return (
        <RenderSingleAvatar
          username={otherParticipants[0].username}
          avatar={otherParticipants[0].avatar}
        />
      );
    } else if (otherParticipantsLength === 2) {
      return (
        <>
          <View style={{ width: 65, height: 65 }} />
          <RenderSingleAvatar
            width={35}
            height={35}
            style={{ position: "absolute", left: 0, top: 20, zIndex: 1 }}
            username={otherParticipants[0].username}
            avatar={otherParticipants[0].avatar}
          />
          <RenderSingleAvatar
            width={35}
            height={35}
            style={{ position: "absolute", right: 0, top: 0 }}
            username={otherParticipants[0].username}
            avatar={otherParticipants[0].avatar}
          />
        </>
      );
    } else {
      return (
        <>
          <View style={{ width: 65, height: 65 }} />
          {otherParticipants?.map(({ username, avatar }, index) => {
            if (index < 3) {
              return (
                <RenderSingleAvatar
                  key={index}
                  width={38}
                  height={38}
                  style={{
                    position: "absolute",
                    right: index * 3,
                    top: index * 5,
                  }}
                  username={username}
                  avatar={avatar}
                />
              );
            }
          })}
        </>
      );
    }
  };

  const onPressConversation = () => {
    props.onPressConversation(props.conversationId, props.index);
  };

  const onPressMarkConversationAsRead = () => {
    props.onPressMarkConversationAsRead(props.index);
  };

  const onPressDeleteConversation = () => {
    closeOptions();
    popup({
      title: "Are you sure you would like to delete this conversation?",
      buttonOptions: [
        {
          text: "No",
          onPress: () => {},
        },
        {
          text: "Yes",
          onPress: () =>
            props.onPressDeleteConversation(props.index, props.conversationId),
          style: "destructive",
        },
      ],
    });
  };

  return (
    <View>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPressConversation}
        style={{
          height: 80,
          backgroundColor,
          borderColor,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View>{resolveAvatars()}</View>
        <View style={{ flex: 1 }}>
          {resolveUsernames()}
          <Text s="sm" numberOfLines={2}>
            {props.message.message}
          </Text>
          <Text w="bold" s="xs">
            {formatMessageDate(props.message.createdAt)}
          </Text>
        </View>
        <View
          style={{
            marginLeft: 10,
            width: 10,
            height: 10,
            backgroundColor: !props.message.read ? tintColor : "transparent",
            borderRadius: 10,
          }}
        />
        <TouchableOpacity
          style={{ paddingHorizontal: 10, alignItems: "center" }}
          onPress={openOptions}
        >
          <View>
            <Icon library="materialComIcons" name="dots-horizontal" size={24} />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
      <SlideUp ref={optionsRef}>
        <SlideUpButton type="delete" onPress={onPressDeleteConversation} />
        <SlideUpButton type="close" onPress={closeOptions} />
      </SlideUp>
    </View>
  );
};

export default Conversations;
