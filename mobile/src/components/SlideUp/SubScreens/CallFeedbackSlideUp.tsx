import { CallContext, ThemeContext } from "../../../contexts";
import { Keyboard, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { forwardRef, useContext, useEffect, useState } from "react";
import { TextInputBox } from "../../Primitives";
import { errorColor, window } from "../../../constants";
import { showBanner } from "../../../utils";

import Button from "../../Primitives/Button";
import { Modalize } from "react-native-modalize";
import SlideUp from "../SlideUp";
import Text from "../../Primitives/Text";
import { useRequest } from "../../../hooks";
import { debounce } from "lodash";

export type Props = {
  /**
   * Will run right before slide up closes (don't pass function to close slide up)
   */
  onClose?: () => any | Promise<any>;
  /**
   * Will run if response is not ok
   */
  onSuccess?: () => any | Promise<any>;
  /**
   * Will run if response is not ok
   */
  onFail?: () => any | Promise<any>;
  /**
   * Will run whether response is ok or not
   */
  onSubmit?: () => any | Promise<any>;
  ref: React.Ref<Modalize>;
};

interface State {
  showReason: boolean;
  showDescription: boolean;
  description: string;
}

const initState: State = {
  showReason: false,
  showDescription: false,
  description: "",
};

const CallFeedbackSlideUp: React.FC<Props> = forwardRef(
  (props: Props, ref: React.Ref<Modalize>) => {
    const {
      onClose = () => {},
      onSubmit = () => {},
      onSuccess = () => {},
      onFail = () => {},
    } = props;
    const callContext = useContext(CallContext);
    const { textColor, borderColor } = useContext(ThemeContext);
    const [state, setState] = useState(initState);
    const [currentFocused, setCurrentFocused] = useState("");
    const [request] = useRequest();

    const changeCurrentFocused = (fieldName: string) =>
      setCurrentFocused(fieldName);

    const keyboardWillHide = () => setCurrentFocused("");

    useEffect(() => {
      Keyboard.addListener("keyboardWillHide", keyboardWillHide);
      return () => {
        Keyboard.removeListener("keyboardWillHide", keyboardWillHide);
      };
    });

    const submitFeedback = debounce(
      async ({
        rating,
        description,
      }: {
        rating: "good" | "bad";
        description?: string;
      }) => {
        await onSubmit();
        const { callId } = callContext.state;
        if (!callId) return;
        const response = await request({
          url: "/user/calls/history",
          method: "PUT",
          body: { callId, rating, description },
        });
        showBanner({
          message: "Thank you for submitting your feedback!",
          type: "success",
        });
        setState(initState);
        if (response.ok) await onSuccess();
        else await onFail();
      },
      500
    );

    return (
      <SlideUp
        ref={ref}
        innerContainerStyle={{ paddingTop: 50, flex: 1 }}
        adjustToContentHeight={false}
        modalHeight={window.height * 0.7}
        onClose={() => {
          onClose();
          setState(initState);
        }}
      >
        {!state.showReason ? (
          <>
            <Text a="center" s="subHeader" w="bold">
              How was the call quality?
            </Text>
            <View
              style={{
                justifyContent: "space-between",
                flexDirection: "row",
                marginTop: 30,
              }}
            >
              <TouchableOpacity
                style={{ ...styles.callQualityButton, borderColor: errorColor }}
                onPress={() => setState({ ...state, showReason: true })}
              >
                <Text a="center" style={{ fontSize: 50 }}>
                  👎
                </Text>
                <Text a="center">Poor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ ...styles.callQualityButton, borderColor: "green" }}
                onPress={() => submitFeedback({ rating: "good" })}
              >
                <Text a="center" style={{ fontSize: 50 }}>
                  👍
                </Text>
                <Text a="center">Great</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : !state.showDescription ? (
          <View style={{ marginVertical: 20 }}>
            <Text s="lg" w="semiBold" linebreak>
              Please tell us why. We're a small team and we really care about
              your feedback!
            </Text>
            <Button
              textStyle={{ color: textColor }}
              outline
              title="Call Dropped ☎️"
              onPress={() =>
                submitFeedback({ rating: "bad", description: "call_dropped" })
              }
            />
            <Button
              textStyle={{ color: textColor }}
              outline
              title="Lagging/Freezing ❄️"
              onPress={() =>
                submitFeedback({
                  rating: "bad",
                  description: "lagging_freezing",
                })
              }
            />
            <Button
              textStyle={{ color: textColor }}
              outline
              title="Inappropriate Content 🤢"
              onPress={() =>
                submitFeedback({
                  rating: "bad",
                  description: "inappropiate_content",
                })
              }
            />
            <Button
              textStyle={{ color: textColor }}
              style={{ borderColor }}
              outline
              title="Other"
              onPress={() => setState({ ...state, showDescription: true })}
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Text s="subHeader" w="bold">
              What went wrong?
            </Text>
            <View style={{ flexGrow: 1, marginTop: 20 }}>
              <TextInputBox
                style={{ height: 300 }}
                label="Feedback"
                placeholderTextColor="gray"
                autoCapitalize="sentences"
                maxLength={2000}
                placeholder="Please Explain"
                currentFocused={currentFocused}
                changeCurrentFocused={changeCurrentFocused}
                value={state.description}
                onChangeText={(description) =>
                  setState({ ...state, description })
                }
                multiline
              />
            </View>
            <Button
              title="Submit"
              onPress={() =>
                submitFeedback({
                  rating: "bad",
                  description: state.description || "no_description_provided",
                })
              }
            />
          </View>
        )}
      </SlideUp>
    );
  }
);

const styles = StyleSheet.create({
  callQualityButton: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 25,
    marginHorizontal: 5,
    borderRadius: 10,
  },
});

export default CallFeedbackSlideUp;
