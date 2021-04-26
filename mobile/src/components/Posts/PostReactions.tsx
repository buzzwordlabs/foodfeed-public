import {
  PostReaction,
  numberWithCommas,
  randomNumberFromRange,
  PostReactionsStringIndexed,
  PostReactionsEmojiIndexed,
  PostReactionStringOptions,
} from "../../utils";
import { ScrollView, TouchableOpacity, ViewStyle, View } from "react-native";
import { Text, Icon } from "../Primitives";
import React, { useContext } from "react";
import { tintColor } from "../../constants";
import { ThemeContext } from "../../contexts";

interface Props {
  reactions: PostReaction[];
  onPressAddNewReaction: () => void;
  onPressReaction: (emojiString: PostReactionStringOptions) => Promise<void>;
  onLongPressReaction: (emojiString: PostReactionStringOptions) => void;
}

const PostReactions = React.memo((props: Props) => {
  const { borderColor } = useContext(ThemeContext);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <TouchableOpacity
        style={{
          borderColor,
          borderWidth: 1,
          borderRadius: 8,
          paddingVertical: 5,
          paddingLeft: 5,
          paddingRight: 8,
          marginRight: 10,
          flexDirection: "row",
          alignItems: "center",
        }}
        onPress={props.onPressAddNewReaction}
        onLongPress={props.onPressAddNewReaction}
      >
        <View>
          <Icon library="materialComIcons" name="plus" size={16} />
        </View>
        <View>
          <Icon library="entypo" name="emoji-happy" size={15} />
        </View>
      </TouchableOpacity>
      {props.reactions.map(({ reaction, reacted, count }, index) => {
        const emoji = PostReactionsStringIndexed[reaction];
        // Skip invalid emojis
        if (reaction === "like" || !emoji)
          return <React.Fragment key={index}></React.Fragment>;
        return (
          <TouchableOpacity
            key={index}
            onPress={() => props.onPressReaction(reaction)}
            onLongPress={() => props.onLongPressReaction(reaction)}
            style={{
              borderWidth: 1,
              borderColor: reacted ? tintColor : borderColor,
              borderRadius: 8,
              paddingVertical: 5,
              paddingHorizontal: 10,
              marginRight: 10,
              flexDirection: "row",
            }}
          >
            <Text style={{ marginRight: 5 }} s="sm" a="center">
              {PostReactionsStringIndexed[reaction]}
            </Text>
            <Text s="sm" a="center">
              {numberWithCommas(count)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

export default PostReactions;
