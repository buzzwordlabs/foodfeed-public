import { findReactionObjectFromArray, PostReaction } from "../../utils";
import React, { useContext } from "react";
import { ThemeContext } from "../../contexts";
import { tintColor } from "../../constants";
import { View, TouchableOpacity } from "react-native";
import { CarouselDots } from "../Carousels";
import { Text, Icon } from "../Primitives";

interface Props {
  onToggleLikePost: () => void;
  reactions: PostReaction[];
  onViewUsersLiked: () => void;
  numCarouselDots: number;
  currentIndex: number;
}

const MediaFooter = React.memo((props: Props) => {
  const { defaultIconColor } = useContext(ThemeContext);

  const likesReactionObject = findReactionObjectFromArray(
    "like",
    props.reactions
  )?.postReaction;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          style={{
            paddingVertical: 5,
            flexDirection: "row",
            alignItems: "center",
          }}
          onPress={props.onToggleLikePost}
        >
          <Icon
            library="ionicons"
            name={`md-heart${likesReactionObject?.reacted ? "" : "-empty"}`}
            size={32}
            color={likesReactionObject?.reacted ? tintColor : defaultIconColor}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingHorizontal: 8, flex: 1 }}
          onPress={props.onViewUsersLiked}
          onLongPress={props.onViewUsersLiked}
        >
          <Text s="lg" w="bold">
            {likesReactionObject?.count === 1
              ? `1 like`
              : `${likesReactionObject?.count} likes`}
          </Text>
        </TouchableOpacity>
      </View>
      {props.numCarouselDots > 1 && (
        <>
          <CarouselDots
            countDots={props.numCarouselDots}
            currentIndex={props.currentIndex}
          />
          <View style={{ flex: 1 }} />
        </>
      )}
    </View>
  );
});

export default MediaFooter;
