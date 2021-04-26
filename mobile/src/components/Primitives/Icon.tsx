import React, { useContext } from "react";
import { TextStyle, ViewStyle, View } from "react-native";

import AntDesign from "react-native-vector-icons/AntDesign";
import Entypo from "react-native-vector-icons/Entypo";
import Feather from "react-native-vector-icons/Feather";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Foundation from "react-native-vector-icons/Foundation";
import { ThemeContext } from "../../contexts";
import { IconLibaries } from "../types";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import SimpleLine from "react-native-vector-icons/SimpleLineIcons";
import { fontScale, errorColor } from "../../constants";
import { IconProps as DefaultIconProps } from "react-native-vector-icons/Icon";
import Text from "./Text";

export interface IconPropsWithoutBadge extends DefaultIconProps {
  name: string;
  size: number;
  library: IconLibaries;
  color?: string;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void | Promise<void>;
}

export interface IconPropsWithBadge extends IconPropsWithoutBadge {
  badge?: boolean;
  badgeStyle?: ViewStyle;
  badgeNumber: number;
}

export type IconProps = IconPropsWithoutBadge | IconPropsWithBadge;

export default function Icon({
  name,
  size = 26 * fontScale,
  style,
  color,
  library = "ionicons",
  onPress,
  ...props
}: IconProps) {
  const { mutedText } = useContext(ThemeContext);
  const finalColor = color || mutedText;
  const finalStyle = [style] as TextStyle;
  const finalSize = size * fontScale;
  const newProps = {
    name,
    size: finalSize,
    style: finalStyle,
    color: finalColor,
    onPress,
  };
  const resolveIcon = () => {
    switch (library) {
      case "feather":
        return <Feather {...newProps} />;
      case "foundation":
        return <Foundation {...newProps} />;
      case "fontAwesome5":
        return <FontAwesome5 {...newProps} />;
      case "fontAwesome":
        return <FontAwesome {...newProps} />;
      case "materialIcons":
        return <MaterialIcons {...newProps} />;
      case "materialComIcons":
        return <MaterialCommunityIcons {...newProps} />;
      case "entypo":
        return <Entypo {...newProps} />;
      case "antdesign":
        return <AntDesign {...newProps} />;
      case "foundation":
        return <Foundation {...newProps} />;
      case "ionicons":
        return <Ionicons {...newProps} />;
      case "simpleLine":
        return <SimpleLine {...newProps} />;
      default:
        return <Ionicons {...newProps} />;
    }
  };

  const badgeNumber = (props as IconPropsWithBadge).badgeNumber;

  return (
    <View>
      {(props as IconPropsWithBadge).badge && badgeNumber > 0 ? (
        <View
          style={[
            {
              position: "absolute",
              top: -8,
              right: -8,
              width: 18,
              height: 18,
              borderRadius: 18,
              backgroundColor: errorColor,
              justifyContent: "center",
              zIndex: 1,
            },
            (props as IconPropsWithBadge).badgeStyle,
          ]}
        >
          <Text a="center" style={{ fontSize: 8 }} w="extraBold">
            {badgeNumber > 99 ? "99+" : badgeNumber}
          </Text>
        </View>
      ) : null}
      {resolveIcon()}
    </View>
  );
}
