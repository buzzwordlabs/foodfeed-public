import {
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { FontSize, FontWeight } from "../types";
import React, { useContext } from "react";
import {
  gradientColors as defaultGradientColors,
  fontScale,
  isSmallDevice,
  shadowBox,
} from "../../constants";

import { ThemeContext } from "../../contexts";
import LinearGradient from "react-native-linear-gradient";
import Text from "./Text";
import { verticalScale } from "react-native-size-matters";
import LoadingIndicator from "./LoadingIndicator";

interface Props {
  style?: ViewStyle | ViewStyle[];
  title?: string;
  children?: React.ReactChild | string;
  textStyle?: TextStyle | TextStyle[];
  gradientColors?: string[];
  outline?: boolean;
  rounded?: boolean;
  textOnly?: boolean;
  onPress: () => any;
  center?: boolean;
  fontWeight?: FontWeight;
  fontSize?: FontSize;
  loading?: boolean;
  disabled?: boolean;
  TextComponent?: Element;
}

const Button = (props: Props) => {
  const {
    style,
    title,
    textStyle,
    children,
    gradientColors,
    outline,
    rounded,
    textOnly,
    onPress,
    center,
    fontWeight,
    fontSize,
    loading,
    disabled,
    TextComponent,
  } = props;

  const { buttonTextColor, tintColor } = useContext(ThemeContext);

  const styles = StyleSheet.create({
    container: {
      height: isSmallDevice
        ? fontScale * verticalScale(50)
        : fontScale * verticalScale(40),
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 6,
      backgroundColor: tintColor,
      marginVertical: verticalScale(5),
      width: "100%",
      ...shadowBox,
    },
    outlineContainer: {
      borderWidth: 2,
      backgroundColor: "transparent",
      borderColor: tintColor,
    },
    textOnlyContainer: {
      borderWidth: 0,
      height: verticalScale(20),
      backgroundColor: "transparent",
    },
    text: {
      color: buttonTextColor,
    },
    outlineText: {
      color: tintColor,
    },
    textOnlyText: {
      color: tintColor,
    },
    roundedContainer: {
      borderRadius: 60 / 2,
    },
    disabled: {
      opacity: 0.4,
    },
    center: {
      alignSelf: "center",
    },
  });

  const determineContainer = () => {
    const containerStyles: ViewStyle[] = [styles.container];
    if (outline) containerStyles.push(styles.outlineContainer);
    else if (textOnly) containerStyles.push(styles.textOnlyContainer);
    if (rounded) containerStyles.push(styles.roundedContainer);
    if (loading || disabled) containerStyles.push(styles.disabled);
    if (center) containerStyles.push(styles.center);
    return containerStyles;
  };

  const determineText = () => {
    const textStyles: TextStyle[] = [styles.text];
    if (outline) textStyles.push(styles.outlineText);
    else if (textOnly) textStyles.push(styles.textOnlyText);
    return textStyles;
  };

  return (
    <TouchableOpacity
      style={[...determineContainer(), style] as ViewStyle}
      onPress={loading || disabled ? () => {} : onPress}
    >
      {gradientColors ? (
        <LinearGradient
          colors={gradientColors || defaultGradientColors}
          style={[...determineContainer(), rounded && { borderRadius: 30 }]}
          useAngle
          angle={45}
          angleCenter={{ x: 0.5, y: 0.5 }}
        >
          {loading ? (
            <LoadingIndicator />
          ) : TextComponent ? (
            TextComponent
          ) : (
            <>
              <Text
                style={[...determineText(), textStyle] as TextStyle}
                weight={fontWeight || "bold"}
                align="center"
                size={fontSize || "lg"}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
              {children}
            </>
          )}
        </LinearGradient>
      ) : loading ? (
        <LoadingIndicator />
      ) : TextComponent ? (
        TextComponent
      ) : (
        <Text
          style={[...determineText(), textStyle] as TextStyle}
          numberOfLines={1}
          weight={fontWeight || "bold"}
          size={fontSize || "lg"}
          align="center"
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
