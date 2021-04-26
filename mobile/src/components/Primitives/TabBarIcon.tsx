import React, { useContext } from "react";
import { ViewStyle } from "react-native";

import Icon, { IconProps, IconPropsWithBadge } from "./Icon";
import { IconLibaries } from "../types";
import { ThemeContext } from "../../contexts";

type Props = {
  name: string;
  size?: number;
  focused: boolean;
  library: IconLibaries;
  color?: string;
  style?: ViewStyle;
  badgeNumber?: number;
  badgeStyle?: ViewStyle;
};

const TabBarIcon = (props: Props) => {
  const { tabIconUnselected, tintColor } = useContext(ThemeContext);
  return (
    <Icon
      badge
      badgeNumber={props.badgeNumber || 0}
      badgeStyle={props.badgeStyle}
      name={props.name}
      size={props.size || 28}
      style={props.style}
      color={props.color || (props.focused ? tintColor : tabIconUnselected)}
      library={props.library}
    />
  );
};

export default TabBarIcon;
