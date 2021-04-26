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
  View,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { getUserDeviceData, popup, showBanner } from "../../utils";

import { AccountStackNavProps } from "../../navigation";
import { useLoadingRequest } from "../../hooks";

type Props = AccountStackNavProps<"Help">;

interface State {
  message: string;
}

const initialState: State = {
  message: "",
};

const Help = (props: Props) => {
  const [state, setState] = useState(initialState);
  const [currentFocused, setCurrentFocused] = useState("");
  const [request, loading] = useLoadingRequest();

  props.navigation.setOptions({
    headerRight: () => (
      <HeaderTextButton
        loading={loading}
        onPress={async () =>
          submit({ message: state.message, reason: "Help Request" })
        }
      />
    ),
  });

  const changeCurrentFocused = (fieldName: string) =>
    setCurrentFocused(fieldName);

  const keyboardWillHide = () => setCurrentFocused("");

  useEffect(() => {
    const keyboardWillHideListener = Keyboard.addListener(
      "keyboardWillHide",
      keyboardWillHide
    );

    return () => keyboardWillHideListener.remove();
  }, []);

  const submit = async ({
    message,
    reason,
  }: {
    message: string;
    reason: string;
  }) => {
    if (message.trim().length === 0) {
      return showBanner({
        message: "Your message cannot be empty.",
        type: "danger",
      });
    }
    const response = await request({
      url: "/user/contact/",
      method: "POST",
      body: {
        message,
        reason,
        deviceInfo: await getUserDeviceData(),
      },
    });
    if (response.ok) {
      showBanner({
        message: "Your help request was successfully sent.",
        type: "success",
      });
      props.navigation.goBack();
    }
  };

  const contactUsPopup = () => {
    popup({
      title: "Help Request",
      description:
        "How would you like us to contact you? We'll contact you ASAP to help you out.",
      buttonOptions: [
        {
          text: "Email",
          onPress: () =>
            submit({
              message: "Please contact me via email.",
              reason: "Emergency Help",
            }),
        },
        { text: "Cancel", onPress: () => {} },
      ],
    });
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
        <View style={{ flex: 1 }}>
          <View>
            <Text w="bold" s="header">
              Here to Help
            </Text>
            <Text style={{ marginVertical: 10 }}>
              Please don't provide any sensitive or personal info
            </Text>
          </View>
          <View style={{ flexGrow: 2 }}>
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
              autoCapitalize="sentences"
              onChangeText={(changedMessage) => {
                setState({ ...state, message: changedMessage });
              }}
            />
          </View>
          <View style={{ marginTop: 10 }}>
            <Text linebreak>
              Too much to explain?{" "}
              <Text t="highlight" onPress={contactUsPopup}>
                Press me
              </Text>{" "}
              and we'll contact you.
            </Text>
          </View>
        </View>
      </ParentView>
    </KeyboardAvoidingView>
  );
};

export default Help;
