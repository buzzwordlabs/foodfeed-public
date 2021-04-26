import Text, { TextProps } from "../Primitives/Text";
import { View, ViewStyle } from "react-native";

import React from "react";
import { tintColor } from "../../constants";

interface Props {
  style?: ViewStyle;
  title?: string;
  textProps?: TextProps;
}

const LiveIndicator = ({ style, textProps, title }: Props) => (
  <View
    style={[
      {
        backgroundColor: `${tintColor}dd`,
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 3,
      },
      style,
    ]}
  >
    <Text s="xs" w="extraBold" style={{ color: "white" }} {...textProps}>
      {title || "LIVE"}
    </Text>
  </View>
);

export default LiveIndicator;
