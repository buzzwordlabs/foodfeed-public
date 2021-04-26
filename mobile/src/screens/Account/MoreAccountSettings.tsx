import {
  Button,
  ParentView,
  PasswordField,
  SlideUp,
  Text,
} from "../../components";
import {
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { deleteCacheAll, popup, showBanner } from "../../utils";
import { useRequest, useSlideUp } from "../../hooks";
import { GlobalContext, ThemeContext } from "../../contexts";
import { tintColor } from "../../constants";

interface State {
  reasonForDeletion: string;
  password: string;
}

const initialState: State = { reasonForDeletion: "", password: "" };

const MoreAccountSettings = () => {
  const global = useContext(GlobalContext);
  const [state, setState] = useState(initialState);
  const { borderColor, textColor } = useContext(ThemeContext);
  const [request] = useRequest();
  const [currentFocused, setCurrentFocused] = useState("");
  const [feedbackRef, openFeedbackSlideUp, closeFeedbackSlideUp] = useSlideUp();
  const [
    passwordConfirmationRef,
    openPasswordConfirmationSlideUp,
    closePasswordConfirmationSlideUp,
  ] = useSlideUp();

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

  const submit = async () => {
    const { reasonForDeletion, password } = state;
    if (reasonForDeletion.length === 0) {
      return showBanner({
        message: "Please describe your reason for deletion.",
        type: "danger",
      });
    }
    const response = await request({
      url: "user/settings/account",
      method: "DELETE",
      body: { reason: reasonForDeletion, password },
    });
    if (response.ok) {
      closeFeedbackSlideUp();
      global.resetState({ seenIntro: true });
      await deleteCacheAll();
    } else {
      if (response.status === 401) {
        showBanner({
          message: "Your password was wrong.",
          type: "danger",
        });
        return openPasswordConfirmationSlideUp();
      } else {
        return showBanner({
          message: "Something went wrong while trying to delete your account.",
          description:
            "Please contact support or leave the screen and try again.",
          type: "danger",
        });
      }
    }
  };

  return (
    <ParentView>
      <View>
        <Text s="header" w="bold">
          Settings
        </Text>
        <View style={{ marginTop: 20, paddingVertical: 10 }}>
          <TouchableOpacity
            style={{
              paddingVertical: 20,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderColor,
            }}
            onPress={() =>
              popup({
                title: "Are you sure you would like to delete your account?",
                description:
                  "Once you delete your account, it cannot be undone. Your username will become available for anyone to take in the future.",
                buttonOptions: [
                  { text: "Cancel", onPress: () => {} },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: openPasswordConfirmationSlideUp,
                  },
                ],
              })
            }
          >
            <Text w="semiBold" t="error">
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <SlideUp ref={feedbackRef}>
        <View style={{ marginTop: 20 }}>
          <Text a="center" s="subHeader" w="bold">
            Why?
          </Text>
          <Text style={{ marginTop: 30 }} w="semiBold">
            We would really appreciate the feedback.
          </Text>
          <View>
            <TextInput
              style={{
                width: "100%",
                marginVertical: 20,
                height: 200,
                fontSize: 16,
                color: textColor,
              }}
              placeholderTextColor="gray"
              autoCapitalize="sentences"
              maxFontSizeMultiplier={1.25}
              maxLength={2000}
              multiline
              placeholder="Write a message"
              selectionColor={tintColor}
              value={state.reasonForDeletion}
              onChangeText={(reasonForDeletion) =>
                setState({ ...state, reasonForDeletion })
              }
            />
            <Text a="right">{state.reasonForDeletion.length}/2000</Text>
            <Button title="Submit" onPress={submit} />
            <Button
              outline
              title="Cancel Deletion"
              onPress={closeFeedbackSlideUp}
            />
          </View>
        </View>
      </SlideUp>
      <SlideUp ref={passwordConfirmationRef}>
        <View>
          <Text a="center" s="subHeader" w="bold" style={{ marginTop: 20 }}>
            Please provide your password as confirmation.
          </Text>
          <View style={{ marginTop: 20 }}>
            <PasswordField
              currentFocused={currentFocused}
              changeCurrentFocused={changeCurrentFocused}
              onChangeText={(password) => setState({ ...state, password })}
              value={state.password}
              label="Password Confirmation"
            />
            <Button
              style={{ marginTop: 10 }}
              title="Submit"
              onPress={() => {
                if (state.password.length === 0) {
                  return showBanner({
                    message: "Please provide a valid password.",
                  });
                }
                closePasswordConfirmationSlideUp();
                openFeedbackSlideUp();
              }}
            />
            <Button
              outline
              title="Cancel Deletion"
              onPress={closePasswordConfirmationSlideUp}
            />
          </View>
        </View>
      </SlideUp>
    </ParentView>
  );
};

export default MoreAccountSettings;
