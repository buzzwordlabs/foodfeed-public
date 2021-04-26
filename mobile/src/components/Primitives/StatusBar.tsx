import {
  StatusBar as DefaultStatusBar,
  Platform,
  StatusBarProps,
} from "react-native";
import React, { useContext } from "react";
import { ThemeContext } from "../../contexts";

const StatusBar = (props: StatusBarProps) => {
  const { themeName, backgroundColor } = useContext(ThemeContext);
  return (
    <DefaultStatusBar
      barStyle={themeName === "dark" ? "light-content" : "dark-content"}
      {...props}
      backgroundColor={backgroundColor}
      hidden={Platform.OS === "android" ? false : props.hidden}
    />
  );
};

export default StatusBar;
