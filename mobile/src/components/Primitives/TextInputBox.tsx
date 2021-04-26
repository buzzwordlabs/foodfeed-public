import React, { useContext } from "react";
import { TextInput, TextInputProps, View, ViewStyle } from "react-native";
import { errorColor, successColor } from "../../constants";
import * as Animatable from "react-native-animatable";
import { ThemeContext } from "../../contexts";
import Icon from "./Icon";
import Text from "./Text";

export interface TextInputBoxProps extends TextInputProps {
  label?: string;
  currentFocused: string;
  changeCurrentFocused: (newFocus: string) => void;
  icon?: (() => Element) | Element;
  showCharacterCountBottomRight?: boolean;
  description?: string;
  showCheckbox?: boolean;
  showCharacterCountTopRight?: boolean;
}

const TextInputBox = (props: TextInputBoxProps) => {
  const {
    label,
    changeCurrentFocused,
    currentFocused,
    placeholder,
    icon,
    style,
    autoCapitalize,
    value,
    maxLength,
    multiline,
    showCharacterCountBottomRight,
    description,
    showCheckbox,
    showCharacterCountTopRight,
  } = props;

  const {
    backgroundColor,
    borderColor,
    textColor,
    tintColor,
    themeName,
  } = useContext(ThemeContext);

  const resolveCheckbox = () => {
    if (value?.length === 0) return;
    if (showCheckbox === true)
      return (
        <Icon
          style={{ position: "absolute", top: 0, right: 0 }}
          library="materialComIcons"
          name="check"
          color={successColor}
          size={18}
        />
      );
    else if (showCheckbox === false)
      return (
        <Icon
          style={{ position: "absolute", top: 0, right: 0 }}
          library="feather"
          name="x"
          color={errorColor}
          size={18}
        />
      );
  };

  return (
    <>
      <Animatable.View
        style={[
          {
            borderWidth: 1,
            borderColor: label === currentFocused ? tintColor : borderColor,
            height: 75,
            borderRadius: 8,
            marginVertical: 10,
            backgroundColor,
          },
          style,
        ]}
      >
        <View
          style={[
            {
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
              marginHorizontal: 10,
            },
            multiline ? { marginVertical: 10 } : {},
          ]}
        >
          <Text s="sm" w="bold">
            {label}
          </Text>
          {showCharacterCountTopRight && label === currentFocused && (
            <View
              style={[
                multiline ? { position: "absolute", right: 0, top: 0 } : {},
              ]}
            >
              <Text a="right" s="sm" w="semiBold">
                {value!.length}/{maxLength || 60}
              </Text>
            </View>
          )}
          {resolveCheckbox()}
        </View>
        <View style={{ flexDirection: "row", flex: 1, alignItems: "center" }}>
          <TextInput
            onFocus={() => changeCurrentFocused(label || "")}
            placeholderTextColor="gray"
            placeholder={placeholder || label}
            autoCapitalize={autoCapitalize || "sentences"}
            clearButtonMode={multiline ? "never" : "while-editing"}
            maxLength={maxLength || 60}
            keyboardType={"default"}
            maxFontSizeMultiplier={1.25}
            selectionColor={tintColor}
            value={value}
            keyboardAppearance={themeName}
            {...props}
            style={[
              {
                flex: 1,
                color: textColor,
                paddingHorizontal: 10,
                fontSize: 18,
                fontFamily: "Muli",
                height: "100%",
                /**
                 * Android specific property
                 * @see https://github.com/facebook/react-native/issues/13897
                 */
                textAlignVertical: "top",
              },
            ]}
          />
          {icon}
          {showCharacterCountBottomRight && label === currentFocused && (
            <View
              style={[
                { padding: 10 },
                multiline ? { position: "absolute", right: 0, bottom: 0 } : {},
              ]}
            >
              <Text a="right" s="sm" w="semiBold">
                {value!.length}/{maxLength || 60}
              </Text>
            </View>
          )}
        </View>
      </Animatable.View>
      {description && (
        <Animatable.View
          animation={label === currentFocused ? "fadeInRight" : "fadeOutRight"}
          duration={500}
        >
          {label === currentFocused && (
            <Text w="bold" s="sm" style={{ paddingHorizontal: 10 }}>
              {description}
            </Text>
          )}
        </Animatable.View>
      )}
    </>
  );
};

export default TextInputBox;
