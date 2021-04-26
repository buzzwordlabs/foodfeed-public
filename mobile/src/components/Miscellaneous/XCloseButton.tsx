import Icon, { IconProps } from "../Primitives/Icon";
import {
  TouchableOpacityProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import React from "react";

interface Props {
  onPress: () => void | Promise<void>;
  touchableOpacityProps?: TouchableOpacityProps;
  iconProps?: IconProps;
  touchableOpacityStyle?: ViewStyle;
}

const XCloseButton = ({
  onPress,
  touchableOpacityProps,
  iconProps,
  touchableOpacityStyle,
}: Props) => (
  <TouchableOpacity
    {...touchableOpacityProps}
    style={[
      { alignItems: "flex-end", paddingVertical: 5, paddingHorizontal: 5 },
      touchableOpacityStyle,
    ]}
    onPress={onPress}
  >
    <Icon library={"antdesign"} name={"close"} size={28} {...iconProps} />
  </TouchableOpacity>
);

export default XCloseButton;
