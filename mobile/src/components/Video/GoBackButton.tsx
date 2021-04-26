import { Platform, TouchableOpacity, ViewStyle } from "react-native";

import Icon from "../Primitives/Icon";
import React from "react";
import { tintColor, fadedTintColor } from "../../constants";

interface Props {
  onPress: () => any;
  style?: ViewStyle;
  color?: string;
  size?: number;
}

const GoBackButton = ({ onPress, style, size, color }: Props) => {
  return (
    <TouchableOpacity
      style={[{ marginLeft: Platform.OS === "ios" ? 15 : 20 }, style]}
      onPress={onPress}
    >
      <Icon
        name={`${Platform.OS === "ios" ? "ios" : "md"}-arrow-back`}
        library="ionicons"
        size={size || Platform.OS === "ios" ? 32 : 24}
        color={color || tintColor}
      />
    </TouchableOpacity>
  );
};

export default GoBackButton;
