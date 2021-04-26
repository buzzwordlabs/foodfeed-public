import {
  HeaderTextButton,
  ParentView,
  Text,
  TextInputBox,
} from "../../components";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { getUserDeviceData, showBanner } from "../../utils";

import { AccountStackNavProps } from "../../navigation";
import { ThemeContext } from "../../contexts";
import { appName } from "../../constants";
import { useLoadingRequest } from "../../hooks";

type Props = AccountStackNavProps<"Feedback">;

interface State {
  message: string;
  isLoading: boolean;
}

const initialState: State = {
  message: "",
  isLoading: false,
};

const Feedback = ({ navigation }: Props) => {
  const { backgroundColor } = useContext(ThemeContext);
  const [state, setState] = useState(initialState);
  const [currentFocused, setCurrentFocused] = useState("");
  const [request, loading] = useLoadingRequest();

  const changeCurrentFocused = (fieldName: string) =>
    setCurrentFocused(fieldName);

  const keyboardWillHide = () => setCurrentFocused("");

  navigation.setOptions({
    headerRight: () => <HeaderTextButton loading={loading} onPress={submit} />,
  });

  useEffect(() => {
    const keyboardWillHideListener = Keyboard.addListener(
      "keyboardWillHide",
      keyboardWillHide
    );

    return () => keyboardWillHideListener.remove();
  }, []);

  const submit = async () => {
    const { message } = state;
    const newMessage = message.trim();
    if (newMessage.trim().length < 2) {
      return showBanner({
        message: "Your message cannot be empty.",
        type: "danger",
      });
    }
    const response = await request({
      url: "/user/contact/",
      method: "POST",
      body: {
        message: newMessage,
        reason: "Feedback",
        deviceInfo: await getUserDeviceData(),
      },
    });
    if (response.ok) {
      showBanner({
        message: "Your feedback was successfully sent.",
        type: "success",
      });
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ParentView
        style={{ flex: 1 }}
        onWrapperPress={Keyboard.dismiss}
        safeBottomInset
      >
        <View style={{ flex: 1, backgroundColor }}>
          <View>
            <Text w="bold" s="header">
              Feedback
            </Text>
            <Text linebreak style={{ marginTop: 10 }}>
              Please don't provide any sensitive or personal info.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={1}
            onPress={Keyboard.dismiss}
            style={{ flex: 1 }}
          >
            <View style={{ flexGrow: 1 }}>
              <TextInputBox
                multiline
                showCharacterCountBottomRight
                label="Message"
                value={state.message}
                currentFocused={currentFocused}
                changeCurrentFocused={changeCurrentFocused}
                style={{ flex: 1, borderWidth: 0 }}
                maxLength={1000}
                numberOfLines={4}
                onChangeText={(message) => setState({ ...state, message })}
                autoCapitalize="sentences"
              />
            </View>
          </TouchableOpacity>
        </View>
      </ParentView>
    </KeyboardAvoidingView>
  );
};

export default Feedback;
