import React, { ReactNode } from "react";
import { TextStyle, TouchableOpacity, ViewStyle } from "react-native";
import Text, { TextProps } from "./Text";

interface Props {
  onPress: () => void;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  title: string;
  textProps?: TextProps;
  IconComponent?: React.ReactNode;
}

const TextButton = (props: Props) => {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      style={[
        props.containerStyle,
        { flexDirection: "row", justifyContent: "center" },
      ]}
    >
      <Text style={props.textStyle} {...props.textProps}>
        {props.title}
      </Text>
      {props.IconComponent}
    </TouchableOpacity>
  );
};

export default TextButton;
