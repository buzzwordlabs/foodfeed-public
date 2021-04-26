import {
  PostReactionEmojisOptions,
  PostReactionsEmojiIndexed,
  PostReactionStringOptions,
} from "../../../utils";
import React, { forwardRef } from "react";
import { Modalize } from "react-native-modalize";
import { Text } from "../../Primitives";
import SlideUp from "../SlideUp";
import { View, TouchableOpacity } from "react-native";

interface Props {
  onPressEmoji: (emoji: PostReactionStringOptions) => void;
}

const EmojiPickerSlideUp = forwardRef(
  (props: Props, ref: React.Ref<Modalize>) => {
    return (
      <SlideUp ref={ref}>
        <View style={{ paddingBottom: 20, paddingTop: 10 }}>
          <View style={{ margin: 20 }}>
            <Text w="bold" s="subHeader">
              Reactions
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {(Object.keys(
              PostReactionsEmojiIndexed
            ) as PostReactionEmojisOptions[]).map((emoji, index) => {
              if (emoji === "❤️")
                return <React.Fragment key={index}></React.Fragment>;
              const emojiString = PostReactionsEmojiIndexed[emoji];
              if (emojiString) {
                return (
                  <TouchableOpacity
                    key={index}
                    style={{ width: "25%", paddingVertical: 10 }}
                    onPress={() =>
                      props.onPressEmoji(PostReactionsEmojiIndexed[emoji])
                    }
                  >
                    <Text style={{ fontSize: 50 }} a="center">
                      {emoji}
                    </Text>
                  </TouchableOpacity>
                );
              }
            })}
          </View>
        </View>
      </SlideUp>
    );
  }
);
export default EmojiPickerSlideUp;
