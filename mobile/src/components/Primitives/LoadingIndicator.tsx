import { ActivityIndicator, ActivityIndicatorProps } from "react-native";
import React, { useContext } from "react";

import { ThemeContext } from "../../contexts";

const LoadingIndicator = (props: ActivityIndicatorProps) => {
  const { textColor } = useContext(ThemeContext);
  return (
    <ActivityIndicator color={textColor} size="small" animating {...props} />
  );
};

export default LoadingIndicator;
