import React, { forwardRef, useState, useContext } from "react";

import { Modalize } from "react-native-modalize";
import SlideUp from "../SlideUp";
import { Text, Button } from "../../Primitives";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { errorColor, muli, window, tintColor } from "../../../constants";
import { useRequest, useKeyboard } from "../../../hooks";
import { debounce } from "lodash";
import SlideUpHeader from "../SlideUpHeader";
import { ThemeContext } from "../../../contexts";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { showBanner, getUserDeviceData } from "../../../utils";

export type Props = {
  /**
   * Will run if user presses cancel button
   */
  onCancel: () => any | Promise<any>;
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

type RequestType = "Help Request" | "Feedback" | "";

interface State {
  requestType: RequestType;
  text: string;
}

const initialState: State = {
  requestType: "",
  text: "",
};

const HelpFeedbackSlideUp: React.FC<Props> = forwardRef(
  (props: Props, ref: React.Ref<Modalize>) => {
    const {
      onSubmit = () => {},
      onClose = () => {},
      onSuccess = () => {},
      onFail = () => {},
      onCancel,
    } = props;
    const [state, setState] = useState(initialState);
    const { themeName, textColor } = useContext(ThemeContext);
    const [request] = useRequest();

    const submit = async () => {
      const newText = state.text.trim();
      if (newText.length < 2) {
        return showBanner({
          message: "Your message cannot be empty.",
          type: "danger",
        });
      }
      onSubmit();
      const response = await request({
        url: "/user/contact/",
        method: "POST",
        body: {
          message: newText,
          reason: state.requestType,
          deviceInfo: await getUserDeviceData(),
        },
      });
      if (response.ok) {
        onSuccess();
        showBanner({
          message: "Your message was successfully sent.",
          type: "success",
        });
      } else {
        onFail();
      }
    };

    const resolve = () => {
      if (state.requestType) {
        return (
          <View style={{ height: window.height - 300 }}>
            <Text s="subHeader" w="bold">
              {state.requestType}
            </Text>
            <View style={{ marginTop: 20, paddingTop: 20, paddingBottom: 20 }}>
              <TextInput
                autoFocus
                multiline
                keyboardAppearance={themeName}
                style={{
                  color: textColor,
                  fontFamily: muli,
                  fontSize: 18,
                  textAlignVertical: "top",
                  marginTop: 10,
                  height: "100%",
                }}
                maxLength={2000}
                value={state.text}
                onChangeText={(text) => setState({ ...state, text })}
                autoCapitalize="sentences"
                maxFontSizeMultiplier={1.25}
                selectionColor={tintColor}
              />
              <View style={{ position: "absolute", top: 0, left: 0 }}>
                <Text s="sm">
                  {state.text.length}/{2000}
                </Text>
              </View>
            </View>
          </View>
        );
      } else {
        return (
          <View>
            <View>
              <Text
                a="center"
                s="subHeader"
                w="bold"
                style={{ marginBottom: 30 }}
              >
                Help or Feedback?
              </Text>
            </View>
            <View style={{ marginTop: 30 }}>
              <Button
                title="Feedback"
                onPress={() => setState({ ...state, requestType: "Feedback" })}
                style={{ marginVertical: 10 }}
              />
              <Button
                outline
                title="Help"
                onPress={() =>
                  setState({ ...state, requestType: "Help Request" })
                }
                style={{ marginVertical: 10 }}
              />
            </View>
          </View>
        );
      }
    };

    return (
      <SlideUp
        ref={ref}
        withHandle={false}
        adjustToContentHeight={false}
        panGestureEnabled={false}
        onClose={() => {
          onClose();
          setState(initialState);
        }}
        HeaderComponent={
          <SlideUpHeader
            onPressX={onCancel}
            onPressGoBack={
              state.requestType
                ? () => setState({ ...state, requestType: "" })
                : undefined
            }
          />
        }
      >
        {resolve()}
        {state.requestType ? <Button title="Submit" onPress={submit} /> : null}
      </SlideUp>
    );
  }
);

export default HelpFeedbackSlideUp;
