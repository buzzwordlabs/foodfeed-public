import {
  Text as DefaultText,
  TextProps as DefaultTextProps,
  TextStyle,
  TouchableOpacity,
} from "react-native";
import {
  FontAlignment,
  FontEllipsizeMode,
  FontSize,
  FontType,
  FontWeight,
} from "../types";
import {
  PTSerif,
  PTSerifBold,
  PTSerifBoldItalic,
  PTSerifItalic,
  muli,
  muliBold,
  muliBoldItalic,
  muliExtraBold,
  muliExtraBoldItalic,
  muliExtraLight,
  muliExtraLightItalic,
  muliItalic,
  muliLight,
  muliLightItalic,
  muliMedium,
  muliMediumItalic,
  muliSemiBold,
  muliSemiBoldItalic,
} from "../../constants";
import React, { ReactNode, useContext, useState } from "react";
import { ThemeContext } from "../../contexts";

export interface TextProps extends DefaultTextProps {
  children?: ReactNode;
  style?: TextStyle | TextStyle[];
  linebreak?: boolean;
  numberOfLines?: number;
  ellipsizeMode?: FontEllipsizeMode;
  italic?: boolean;
  size?: FontSize;
  s?: FontSize;
  type?: FontType;
  t?: FontType;
  align?: FontAlignment;
  a?: FontAlignment;
  weight?: FontWeight;
  w?: FontWeight;
  serif?: boolean;
  truncateConfig?: {
    maxLength: number;
  };
}

const Text = ({
  children,
  style,
  linebreak,
  numberOfLines,
  ellipsizeMode,
  size,
  type,
  align,
  italic,
  weight,
  serif,
  s,
  t,
  a,
  w,
  truncateConfig,
  ...props
}: TextProps) => {
  const {
    errorColor,
    mutedText,
    successColor,
    textColor,
    tintColor,
  } = useContext(ThemeContext);

  const [isExpanded, setIsExpanded] = useState(false);

  const resolveFontSize = (size: FontSize | undefined) => {
    switch (size) {
      case "xs":
        return 10;
      case "sm":
        return 12;
      case "md":
        return 14;
      case "lg":
        return 15;
      case "xl":
        return 18;
      case "xxl":
        return 20;
      case "subHeader":
        return 26;
      case "header":
        return 30;
      default:
        return 14;
    }
  };

  const resolveAlignment = (align: FontAlignment | undefined) => {
    switch (align) {
      case "left":
        return { textAlign: "left", alignSelf: "flex-start" };
      case "center":
        return { textAlign: "center", alignSelf: "center" };
      case "right":
        return { textAlign: "right", alignSelf: "flex-end" };
      default:
        return { textAlign: "left", alignSelf: "flex-start" };
    }
  };

  const resolveType = (type: FontType | undefined) => {
    switch (type) {
      case "error":
        return errorColor;
      case "success":
        return successColor;
      case "muted":
        return mutedText;
      case "highlight":
        return tintColor;
      case "none":
        return textColor;
      default:
        return textColor;
    }
  };

  const resolveFont = (
    fontWeight: FontWeight | undefined,
    italic: boolean | undefined,
    serif: boolean | undefined
  ) => {
    if (serif) {
      if (italic) {
        if (fontWeight === "bold") return PTSerifBoldItalic;
        else return PTSerifItalic;
      }
      if (fontWeight === "bold") return PTSerifBold;
      else return PTSerif;
    }
    if (italic) {
      switch (fontWeight) {
        case "extraLight":
          return muliExtraLightItalic;
        case "light":
          return muliLightItalic;
        case "regular":
          return muliItalic;
        case "medium":
          return muliMediumItalic;
        case "semiBold":
          return muliSemiBoldItalic;
        case "bold":
          return muliBoldItalic;
        case "extraBold":
          return muliExtraBoldItalic;
        default:
          return muliItalic;
      }
    }
    switch (fontWeight) {
      case "extraLight":
        return muliExtraLight;
      case "light":
        return muliLight;
      case "regular":
        return muli;
      case "medium":
        return muliMedium;
      case "semiBold":
        return muliSemiBold;
      case "bold":
        return muliBold;
      case "extraBold":
        return muliExtraBold;
      default:
        return muli;
    }
  };

  const manualTruncator = (string: string, maxLength: number) => {
    let truncatedString = string.trim();
    if (truncatedString.length > maxLength) {
      // trim the string to the maximum length
      truncatedString = truncatedString.substr(0, maxLength);
      //re-trim if we are in the middle of a word
      truncatedString =
        truncatedString.substr(
          0,
          Math.min(truncatedString.length, truncatedString.lastIndexOf(" "))
        ) + "...";
    }
    return truncatedString;
  };

  const fontFamily = resolveFont(weight || w, italic, serif);
  const fontSize = resolveFontSize(size || s);
  const alignment = resolveAlignment(align || a);
  const color = resolveType(type || t);
  const finalStyle = [
    { fontFamily, fontSize, color, ...alignment },
    style,
  ] as TextStyle;

  const shouldBeTruncatedManually =
    typeof children === "string"
      ? truncateConfig?.maxLength
        ? true
        : false
      : false;

  const stringIsLongerThanMaxLength =
    typeof children === "string"
      ? (children as string).length > (truncateConfig?.maxLength || 0)
      : false;

  return !shouldBeTruncatedManually ? (
    <DefaultText
      style={finalStyle}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      suppressHighlighting
      maxFontSizeMultiplier={1.5}
      allowFontScaling={false}
      {...props}
    >
      {children}
      {linebreak && "\n"}
    </DefaultText>
  ) : (
    <TouchableOpacity
      onPress={() => setIsExpanded((setIsExpanded) => !setIsExpanded)}
      activeOpacity={stringIsLongerThanMaxLength ? 0.5 : 1}
    >
      <DefaultText
        style={finalStyle}
        numberOfLines={truncateConfig ? undefined : numberOfLines}
        ellipsizeMode={truncateConfig ? undefined : ellipsizeMode}
        suppressHighlighting
        maxFontSizeMultiplier={1.5}
        allowFontScaling={false}
        {...props}
        onPress={undefined}
      >
        {isExpanded
          ? children
          : manualTruncator(children as string, truncateConfig!.maxLength)}
        {linebreak && "\n"}
      </DefaultText>
      {stringIsLongerThanMaxLength && (
        <DefaultText
          maxFontSizeMultiplier={1.5}
          suppressHighlighting
          allowFontScaling={false}
          style={[
            finalStyle,
            {
              color: tintColor,
              fontFamily: muli,
              paddingVertical: 5,
              fontSize: 12,
            },
          ]}
        >
          {`See ${isExpanded ? "Less" : "More"}`}
        </DefaultText>
      )}
    </TouchableOpacity>
  );
};

export default Text;
