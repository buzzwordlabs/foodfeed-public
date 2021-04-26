import {
  Platform,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
import React, { useContext } from "react";
import { shadowBoxTop, tintColor } from "../../constants";

import { ThemeContext } from "../../contexts";
import Icon from "../Primitives/Icon";
import Text from "../Primitives/Text";

interface Props {
  submit: () => any;
  onChangeText: (text: string) => any;
  value: string;
  maxLength: number;
  placeholder?: string;
  style?: ViewStyle;
  textInputStyle?: TextStyle;
  textInputContainerStyle?: ViewStyle;
  transparent?: boolean;
  showWordCount?: boolean;
  RightComponent?: React.ReactNode;
  textInputProps?: TextInputProps;
}

const ChatTextInput = (props: Props) => {
  const {
    submit,
    value,
    onChangeText,
    maxLength,
    placeholder,
    style,
    textInputStyle,
    textInputContainerStyle,
    transparent,
    RightComponent,
    textInputProps,
  } = props;
  const {
    textColor,
    backgroundColor,
    chatTextInputBackgroundColor,
    chatTextInputPlaceholderColor,
  } = useContext(ThemeContext);
  return (
    <View>
      {props.showWordCount && (
        <View style={{ marginLeft: 20, marginTop: 12 }}>
          <Text
            s="sm"
            w="semiBold"
            style={{ color: chatTextInputPlaceholderColor }}
          >
            {value.length}/{maxLength}
          </Text>
        </View>
      )}
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            backgroundColor,
          },
          transparent
            ? { backgroundColor: "rgba(0,0,0,0.7)" }
            : { ...shadowBoxTop },
          style,
        ]}
      >
        <View
          style={[
            {
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-between",
              backgroundColor: chatTextInputBackgroundColor,
              borderRadius: 5,
              marginLeft: 10,
              paddingRight: 10,
            },
            textInputContainerStyle,
          ]}
        >
          <TextInput
            style={[
              {
                color: textColor,
                fontFamily: "Muli",
                paddingBottom: 12,
                paddingTop: 12,
                paddingHorizontal: 10,
                flex: 1,
              },
              textInputStyle,
            ]}
            placeholderTextColor={chatTextInputPlaceholderColor}
            placeholder={placeholder || "Say something nice"}
            maxLength={maxLength}
            value={value}
            onChangeText={onChangeText}
            selectionColor={tintColor}
            multiline
            {...textInputProps}
          />
        </View>
        <TouchableOpacity style={{ marginHorizontal: 15 }} onPress={submit}>
          <Icon
            library="ionicons"
            name={`${Platform.OS === "ios" ? "ios" : "md"}-send`}
            color={value.length > 0 ? tintColor : "gray"}
            size={30}
            style={{ alignSelf: "center" }}
          />
        </TouchableOpacity>
        {RightComponent}
      </View>
    </View>
  );
};

export default ChatTextInput;
