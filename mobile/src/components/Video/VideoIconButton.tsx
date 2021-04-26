import Icon, { IconProps } from "../Primitives/Icon";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";

import React from "react";

type OverWrittenProps = {
  size?: number;
  color?: string;
};

type Props = {
  iconProps: Omit<IconProps, keyof OverWrittenProps> & OverWrittenProps;
  TopComponent?: React.ReactNode;
} & TouchableOpacityProps;

const VideoIconButton = ({
  iconProps,
  style,
  TopComponent,
  ...props
}: Props) => {
  return (
    <TouchableOpacity
      style={[
        { width: 40, alignItems: "center", justifyContent: "space-between" },
        style,
      ]}
      {...props}
    >
      {TopComponent}
      <Icon size={36} color="white" {...iconProps} />
    </TouchableOpacity>
  );
};

export default VideoIconButton;
