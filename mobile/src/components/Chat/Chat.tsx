import {
  FlatList,
  Platform,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { fadedTintColor, tintColor } from "../../constants";
import React, { forwardRef } from "react";

import { Avatar } from "../Miscellaneous";
import { Message as MessageData } from "../../contexts";
import Text from "../Primitives/Text";
import { Icon } from "../Primitives";
import { User } from "../../utils";

interface Props {
  messages: MessageData[];
  onPressMessage: (userInfo: User) => any;
  flatListStyle?: ViewStyle;
  messageContainerStyle?: ViewStyle;
  maxHeight?: number;
  streamOwner?: string;
}

const Chat = forwardRef((props: Props, chatRef: any) => {
  const {
    messages,
    messageContainerStyle,
    flatListStyle,
    maxHeight,
    onPressMessage,
    streamOwner,
  } = props;

  const renderFlatList = () => (
    <FlatList
      showsVerticalScrollIndicator
      ref={chatRef}
      style={[
        { paddingHorizontal: 10, paddingTop: 10, maxHeight },
        flatListStyle,
      ]}
      data={messages}
      keyExtractor={(item, index) => index.toString()}
      ListEmptyComponent={
        <Text style={{ marginTop: 50 }} a="center" s="lg">
          No messages yet.
        </Text>
      }
      renderItem={({ item, index }: { item: MessageData; index: number }) => {
        const { username, avatar } = item;
        return (
          <Message
            {...item}
            isFromStreamOwner={streamOwner === username}
            style={messageContainerStyle!}
            onPress={() => onPressMessage({ username, avatar })}
          />
        );
      }}
    />
  );
  return renderFlatList();
});

interface MessageProps extends MessageData {
  onPress: () => any | Promise<any>;
  isFromStreamOwner: boolean;
  style: ViewStyle;
}

const Message = (props: MessageProps) => {
  const {
    onPress,
    message,
    username,
    avatar,
    time,
    style,
    isFromStreamOwner,
  } = props;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginVertical: 5,
        backgroundColor: isFromStreamOwner ? fadedTintColor : "transparent",
        borderRadius: 6,
      }}
    >
      <View style={[{ flexDirection: "row", alignItems: "center" }, style]}>
        <View style={{ alignSelf: "flex-start", marginTop: 10 }}>
          <Avatar avatar={avatar} style={{ height: 30, width: 30 }} />
          {isFromStreamOwner && (
            <View style={{ position: "absolute", right: -5, top: -3 }}>
              <Icon
                name={`${Platform.OS === "ios" ? "ios" : "md"}-star`}
                library="ionicons"
                color={tintColor}
                size={16}
              />
            </View>
          )}
        </View>
        <View style={{ paddingHorizontal: 10, marginRight: 20 }}>
          {isFromStreamOwner && (
            <Text s="sm" w="bold" t="highlight">
              From the streamer
            </Text>
          )}
          <Text s="sm" w="bold">
            {username} {time}
          </Text>
          <Text w="semiBold">{message}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Chat;
