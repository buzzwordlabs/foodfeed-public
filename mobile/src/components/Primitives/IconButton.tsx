import AntDesign from "react-native-vector-icons/AntDesign";
import Entypo from "react-native-vector-icons/Entypo";
import Feather from "react-native-vector-icons/Feather";
import { IconLibaries } from "../types";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import React from "react";
import Text from "./Text";
import { ViewStyle } from "react-native";

interface Props {
  name: string;
  size: number;
  library: IconLibaries;
  text?: string | Element;
  backgroundColor?: string;
  iconStyle?: any;
  color?: string;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void | Promise<void>;
}

export default function Icon({
  name,
  size = 26,
  style,
  color = "lightgray",
  library = "ionicons",
  backgroundColor,
  iconStyle,
  onPress,
  text,
}: Props) {
  const finalStyle = [{ marginBottom: -3 }, style && style] as ViewStyle;
  const props = {
    name: name,
    size: size,
    iconStyle: iconStyle,
    backgroundColor: backgroundColor,
    style: finalStyle,
    color: color,
    onPress: onPress && onPress,
  };
  switch (library) {
    case "feather":
      return (
        <Feather.Button {...props}>
          <Text>{text}</Text>
        </Feather.Button>
      );
    case "materialIcons":
      return (
        <MaterialIcons.Button {...props}>
          <Text>{text}</Text>
        </MaterialIcons.Button>
      );
    case "materialComIcons":
      return (
        <MaterialCommunityIcons.Button {...props}>
          <Text>{text}</Text>
        </MaterialCommunityIcons.Button>
      );
    case "entypo":
      return (
        <Entypo.Button {...props}>
          <Text>{text}</Text>
        </Entypo.Button>
      );
    case "antdesign":
      return (
        <AntDesign.Button {...props}>
          <Text>{text}</Text>
        </AntDesign.Button>
      );
    case "ionicons":
      return (
        <Ionicons.Button {...props}>
          <Text>{text}</Text>
        </Ionicons.Button>
      );
    default:
      return (
        <Ionicons.Button {...props}>
          <Text>{text}</Text>
        </Ionicons.Button>
      );
  }
}
