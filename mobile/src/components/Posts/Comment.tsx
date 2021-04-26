import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "../Primitives";
import { Avatar } from "../Miscellaneous";
import { InitialFocusedCommentState } from "../../screens/Common/ViewPostComments";
import { Comment as CommentType } from "./ImagePost";
import { formatPGDateHumanized } from "../../utils";

interface Props extends CommentType {
  showAvatar: boolean;
  onPressProfile: (username: string) => void;
  onPressComment: (() => void) | ((args: InitialFocusedCommentState) => void);
  onLongPressComment?: (args: InitialFocusedCommentState) => void;
  numberOfLinesComment?: number;
  truncate?: boolean;
}

const Comment = React.memo((props: Props) => {
  const onPressProfile = () => {
    props.onPressProfile(props.username);
  };

  const onLongPress = () => {
    props.onLongPressComment &&
      props.onLongPressComment({
        commentId: props.id,
        avatar: props.avatar,
        username: props.username,
      });
  };

  const onPressComment = () =>
    props.onPressComment({
      username: props.username,
      avatar: props.avatar,
      commentId: props.id,
    });

  if (props.truncate) {
    return (
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 3,
        }}
        onPress={onPressComment}
      >
        <TouchableOpacity
          style={{ marginRight: 5, flexDirection: "row", alignItems: "center" }}
          onPress={onPressProfile}
        >
          {props.showAvatar && (
            <Avatar
              avatar={props.avatar}
              style={{ width: 30, height: 30, marginRight: 5 }}
            />
          )}
          <View>
            <Text w="semiBold" numberOfLines={1} ellipsizeMode="tail">
              {props.username}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text s="sm" numberOfLines={1} ellipsizeMode="tail">
            {props.comment}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
      }}
      onLongPress={onLongPress}
      onPress={onPressComment}
    >
      <TouchableOpacity
        style={{ marginRight: 5, alignSelf: "flex-start" }}
        onPress={onPressProfile}
      >
        {props.showAvatar && (
          <Avatar
            avatar={props.avatar}
            style={{ width: 30, height: 30, marginRight: 5 }}
          />
        )}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <TouchableOpacity onPress={onPressProfile}>
          <Text w="semiBold" numberOfLines={1} ellipsizeMode="tail">
            {props.username}
          </Text>
        </TouchableOpacity>
        <Text s="sm" ellipsizeMode="tail">
          {props.comment}
        </Text>
        <View style={{ marginTop: 5 }}>
          <Text s="xs" t="muted">
            {formatPGDateHumanized(props.createdAt, true)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default Comment;
