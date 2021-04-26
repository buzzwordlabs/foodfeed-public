import React, { forwardRef, useContext, useState } from "react";
import { showBanner } from "../../../utils";
import { TextInput, View } from "react-native";

import Button from "../../Primitives/Button";
import { ThemeContext } from "../../../contexts";
import { Modalize } from "react-native-modalize";
import SlideUp from "../SlideUp";
import Text from "../../Primitives/Text";
import { spam } from "../../../assets";
import { useRequest } from "../../../hooks";
import { debounce } from "lodash";
import FastImage from "react-native-fast-image";
import { tintColor } from "../../../constants";

// export type ReportData<K extends ReportType, T> = { [P in K]: T }

export type ReportData =
  | ReportUserData
  | ReportPostData
  | ReportStreamViewerData
  | ReportStreamStreamerData
  | ReportCallData
  | ReportCommentData;

interface ReportUserData {
  username: string;
}
interface ReportCommentData {
  username: string;
  postId: string;
  commentId: string;
}
interface ReportPostData {
  postId: string;
}
interface ReportStreamViewerData {
  deviceId: string;
}

interface ReportStreamStreamerData {
  deviceId: string;
}

interface ReportCallData {
  callId: string;
}

export type ReportType =
  | "call"
  | "post"
  | "post-comment"
  | "user"
  | "streamer-reports-viewer"
  | "viewer-reports-streamer"
  | "post-comment";

interface Props {
  type: ReportType;
  reportData: ReportData;
  username: string;
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
  onSuccess?: (username: string) => any | Promise<any>;
  /**
   * Will run if response is not ok
   */
  onFail?: (username: string) => any | Promise<any>;
  /**
   * Will run whether response is ok or not
   */
  onSubmit?: () => any | Promise<any>;
}

interface State {
  reason: string;
  showReason: boolean;
}

const initialState: State = {
  reason: "",
  showReason: false,
};

const ReportUserSlideUp = forwardRef(
  (props: Props, ref: React.Ref<Modalize>) => {
    const { textColor, borderColor } = useContext(ThemeContext);
    const [state, setState] = useState(initialState);
    const { showReason, reason } = state;
    const {
      onSubmit = () => {},
      onClose = () => {},
      onSuccess = () => {},
      onFail = () => {},
      onCancel,
    } = props;
    const [request] = useRequest();

    const submit = debounce(async ({ reason }: { reason: string }) => {
      await onSubmit();

      const response = await request({
        url: "user/tattle/report",
        method: "POST",
        body: {
          type: props.type,
          metadata: { ...props.reportData },
          username: props.username,
          reason: reason || "no-reason-provided",
        },
      });
      if (response.ok) {
        await onSuccess(props.username);
        showBanner({ message: `${props.username} has been blocked` });
      } else {
        await onFail(props.username);
        showBanner({ message: `An error has occurred.` });
      }
    }, 500);

    return (
      <SlideUp
        ref={ref}
        justifyContentCenter
        adjustToContentHeight={false}
        onClose={onClose}
      >
        <View>
          {!showReason ? (
            <View>
              <Text a="center" s="subHeader" w="bold">
                {`Report`}
              </Text>
              <View style={{ marginVertical: 20 }}>
                <Text s="lg" w="bold" linebreak>
                  Please tell us your reason for this report request so that we
                  can investigate this further.
                </Text>
                <Text t="error" linebreak>
                  We will block this person after you report them.
                </Text>
                <Button
                  outline
                  textStyle={{ color: textColor }}
                  title="Bullying 😠"
                  onPress={async () => submit({ reason: "bullying" })}
                />
                <Button
                  textStyle={{ color: textColor }}
                  outline
                  title="Inappropriate Content 🤢"
                  onPress={async () =>
                    submit({
                      reason: "inappropriate_content",
                    })
                  }
                />
                <Button
                  onPress={async () => submit({ reason: "spam" })}
                  textStyle={{ color: textColor }}
                  outline
                  TextComponent={
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text w="bold" s="lg">
                        Spam{" "}
                      </Text>
                      <FastImage
                        style={{ width: 20, height: 20 }}
                        source={spam}
                      />
                    </View>
                  }
                />
                <Button
                  outline
                  onPress={async () => submit({ reason: "fraud" })}
                  textStyle={{ color: textColor }}
                  title="Fraud 👤"
                />
                <Button
                  outline
                  onPress={() => setState({ ...state, showReason: true })}
                  textStyle={{ color: textColor }}
                  title="Other"
                />
                <Button
                  outline
                  onPress={onCancel}
                  textStyle={{ color: textColor }}
                  style={{ borderColor }}
                  title="Cancel"
                />
              </View>
            </View>
          ) : (
            <View>
              <Text a="center" s="subHeader" w="bold">
                Report
              </Text>
              <View>
                <TextInput
                  style={{
                    width: "100%",
                    marginVertical: 20,
                    height: 150,
                    fontSize: 16,
                    color: textColor,
                    fontFamily: "Muli",
                  }}
                  placeholderTextColor="gray"
                  autoCapitalize="sentences"
                  maxLength={2000}
                  multiline
                  maxFontSizeMultiplier={1.25}
                  placeholder="Write a message"
                  value={reason}
                  selectionColor={tintColor}
                  onChangeText={(reason) => setState({ ...state, reason })}
                />
                <Button
                  title="Submit"
                  onPress={async () => {
                    if (!state.reason || state.reason.length < 5) {
                      return showBanner({
                        message: "Please provide a reason.",
                        type: "danger",
                      });
                    }
                    submit({ reason: state.reason });
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </SlideUp>
    );
  }
);

export default ReportUserSlideUp;
