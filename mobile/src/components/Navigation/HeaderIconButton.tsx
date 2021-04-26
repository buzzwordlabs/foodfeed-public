import React from "react";
import { TouchableOpacity, ViewStyle } from "react-native";
import { LoadingIndicator } from "../Primitives";
import Icon, { IconProps } from "../Primitives/Icon";

interface Props {
  onPress: () => any;
  iconProps: IconProps;
  loading?: boolean;
  style?: ViewStyle;
}

const HeaderIconButton = (props: Props) => {
  return (
    <TouchableOpacity onPress={props.onPress} style={props.style}>
      {props.loading ? <LoadingIndicator /> : <Icon {...props.iconProps} />}
    </TouchableOpacity>
  );
};

export default HeaderIconButton;
