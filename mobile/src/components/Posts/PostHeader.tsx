import React, { useContext } from "react";
import { ThemeContext } from "../../contexts";
import { View, TouchableOpacity } from "react-native";
import { Avatar } from "../Miscellaneous";
import { Icon, Text } from "../Primitives";
import { formatMessageDate } from "../../utils";

interface Props {
  avatar: string;
  username: string;
  createdAt: string;
  isPostOwner: boolean;
  isFollowing: boolean;
  onViewPostOwnerProfile: () => void;
  toggleFollow: () => void;
  openImagePostOptionsSlideUp: () => void;
}

const PostHeader = React.memo((props: Props) => {
  const { borderColor } = useContext(ThemeContext);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <TouchableOpacity
          onPress={props.onViewPostOwnerProfile}
          style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        >
          <Avatar avatar={props.avatar} style={{ width: 35, height: 35 }} />
          <View style={{ marginLeft: 10 }}>
            <Text w="bold" s="lg" ellipsizeMode="tail" numberOfLines={1}>
              {props.username}
            </Text>
          </View>
        </TouchableOpacity>
        {!props.isPostOwner ? (
          !props.isFollowing ? (
            <TouchableOpacity
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderColor,
                borderWidth: 1,
                borderRadius: 4,
              }}
              onPress={props.toggleFollow}
            >
              <Text s="sm" w="semiBold">
                Follow
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ paddingHorizontal: 10 }}>
              <Text s="sm" w="semiBold">
                Following
              </Text>
            </View>
          )
        ) : (
          <></>
        )}
        <TouchableOpacity
          style={{ paddingLeft: 10 }}
          onPress={props.openImagePostOptionsSlideUp}
        >
          <Icon library="materialComIcons" name="dots-horizontal" size={26} />
        </TouchableOpacity>
      </View>
      <Text
        style={{ marginTop: 10 }}
        s="xs"
        t="muted"
        ellipsizeMode="tail"
        numberOfLines={1}
      >
        {formatMessageDate(props.createdAt)}
      </Text>
    </View>
  );
});

export default PostHeader;
