import React from "react";
import FastImage, { FastImageProps } from "react-native-fast-image";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Post } from "./ImagePost";

interface Props extends Post {
  width: number;
  height: number;
  imageProps?: FastImageProps;
  onPress: (
    postId: string,
    onDeletePostCallback: (postId: string) => void
  ) => void;
  onDeletePostCallback: (postId: string) => void;
}

const PostThumbnail = React.memo(
  ({
    width,
    height,
    imageProps,
    onPress,
    onDeletePostCallback,
    ...postData
  }: Props) => {
    const onPressOverride = () => onPress(postData.id, onDeletePostCallback);
    return (
      <TouchableOpacity
        onPress={onPressOverride}
        style={{ padding: StyleSheet.hairlineWidth, width, height }}
        activeOpacity={0.7}
      >
        <FastImage
          source={{ uri: postData.media[0].uri }}
          style={{ width: "100%", height: "100%" }}
          {...imageProps}
        />
      </TouchableOpacity>
    );
  }
);

export default PostThumbnail;
