import React, { useState } from "react";

import FastImage from "react-native-fast-image";
import { ImageStyle } from "react-native";
import { avatarPlaceholder } from "../../assets/images";

interface Props {
  avatar: string;
  style: ImageStyle;
}

const Avatar = (props: Props) => {
  const [valid, setValid] = useState(true);
  const { avatar, style } = props;

  return (
    <FastImage
      onError={() => setValid(false)}
      style={[{ borderRadius: 1000 }, style]}
      source={{ uri: !valid ? avatarPlaceholder : avatar || avatarPlaceholder }}
      resizeMode={FastImage.resizeMode.cover}
    />
  );
};

export default Avatar;
