import React, { forwardRef, useRef, useState } from "react";

import { Modalize } from "react-native-modalize";
import SlideUp from "../SlideUp";
import {
  View,
  TouchableOpacity,
  Linking,
  Platform,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";
import { isIphoneX } from "../../../constants/statusBar";
import { Icon, Text, LoadingIndicator } from "../../Primitives";
import { useSlideUp } from "../../../hooks";
import { SlideUpButton } from "../Buttons";
import Clipboard from "@react-native-community/clipboard";
import { launchShare } from "../../../utils";
import {
  shadowBoxTop,
  shadowBox,
  window,
  statusBarHeight,
} from "../../../constants";

export type Props = {
  onPressClose: () => any | Promise<any>;
  onClose?: () => any | Promise<any>;
  uri: string;
  ref: React.Ref<Modalize>;
};

type State = {
  title: string;
  subTitle: string;
};

const initialState: State = {
  title: "",
  subTitle: "",
};

const WebViewSlideUp: React.FC<Props> = forwardRef(
  (props: Props, ref: React.Ref<Modalize>) => {
    const { onClose = () => {}, onPressClose = () => {}, uri } = props;

    const [state, setState] = useState(initialState);

    let webViewRef: any = useRef(null);

    const [
      ellipsizeSlideUpRef,
      openEllipsizeSlideUp,
      closeEllipsizeSlideUp,
    ] = useSlideUp();

    const copy = async () => {
      Clipboard.setString(uri);
      await Clipboard.getString();
      closeEllipsizeSlideUp();
    };

    const openInBrowser = async () => {
      const canOpen = await Linking.canOpenURL(uri);
      if (canOpen) {
        closeEllipsizeSlideUp();
        onPressClose();
        Linking.openURL(uri);
      }
    };

    const goBack = () => {
      webViewRef?.goBack();
    };

    const goForward = () => {
      webViewRef?.goForward();
    };

    const refresh = () => {
      webViewRef?.reload();
    };

    const share = async () => {
      closeEllipsizeSlideUp();
      await launchShare({
        type: "webview_link",
        title: state.title,
        message: "",
        url: uri,
      });
    };

    const deconstructURL = (url: string) => {
      var pathArray = url.split("/");
      var protocol = pathArray[0];
      var host = pathArray[2];
      var baseURL = protocol + "//" + host;
      return { pathArray, protocol, host, baseURL };
    };

    return (
      <>
        <SlideUp
          ref={ref}
          modalHeight={window.height - (isIphoneX() ? statusBarHeight + 20 : 0)}
          adjustToContentHeight={false}
          isMandatory
          modalStyle={{ flex: 1 }}
          innerContainerStyle={{
            flex: 1,
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
          }}
          scrollViewProps={{ contentContainerStyle: { flex: 1 } }}
          onClose={onClose}
          withHandle={false}
          HeaderComponent={
            <View
              style={{
                height: 50,
                backgroundColor: "#262626",
                alignItems: "center",
                justifyContent: "space-between",
                flexDirection: "row",
                paddingHorizontal: 8,
                ...shadowBox,
              }}
            >
              <TouchableOpacity onPress={onPressClose}>
                <Icon
                  library="antdesign"
                  name="close"
                  size={28}
                  color="white"
                />
              </TouchableOpacity>
              <View>
                {state.title ? (
                  <Text w="extraBold" a="center">
                    {state.title}
                  </Text>
                ) : null}
                {state.subTitle ? (
                  <Text s="xs" a="center" t="muted">
                    <Icon
                      library={"ionicons"}
                      name={`${Platform.OS === "ios" ? "ios" : "md"}-lock`}
                      size={12}
                      color="lightgray"
                    />{" "}
                    {state.subTitle}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={openEllipsizeSlideUp}>
                <Icon
                  library="materialComIcons"
                  name="dots-horizontal"
                  size={32}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          }
          FooterComponent={
            <View
              style={{
                height: 50 + (isIphoneX() ? 20 : 0),
                backgroundColor: "#262626",
                ...shadowBoxTop,
                borderTopColor: "#2A2A2A",
                borderTopWidth: StyleSheet.hairlineWidth,
              }}
            >
              <View
                style={{
                  marginVertical: isIphoneX() ? 10 : 0,
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexDirection: "row",
                  paddingHorizontal: 8,
                }}
              >
                <TouchableOpacity
                  style={{ width: 50, alignItems: "center" }}
                  onPress={goBack}
                >
                  <Icon
                    library={"materialComIcons"}
                    name={"chevron-left"}
                    size={40}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ width: 50, alignItems: "center" }}
                  onPress={goForward}
                >
                  <Icon
                    library={"materialComIcons"}
                    name={"chevron-right"}
                    size={40}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ width: 50, alignItems: "center" }}
                  onPress={share}
                >
                  <Icon
                    library={"ionicons"}
                    name={`${Platform.OS === "ios" ? "ios" : "md"}-share`}
                    size={30}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ width: 50, alignItems: "center" }}
                  onPress={refresh}
                >
                  <Icon
                    library={"ionicons"}
                    name={`${Platform.OS === "ios" ? "ios" : "md"}-refresh`}
                    size={26}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={{ width: 50 }} />
              </View>
            </View>
          }
        >
          <WebView
            ref={(ref) => (webViewRef = ref)}
            injectedJavaScript={`(() => {
              window.ReactNativeWebView.postMessage(JSON.stringify(document.getElementsByTagName("title")[0].innerText));
            })();`}
            source={{ uri }}
            onMessage={(event) => {
              const title = event.nativeEvent?.data.split("");
              title.pop();
              title.shift();
              setState({
                ...state,
                subTitle: deconstructURL(event.nativeEvent?.url).host,
                title: title.join(""),
              });
            }}
            startInLoadingState
            renderLoading={() => (
              <View
                style={{
                  backgroundColor: "#FAFAFA",
                  flex: 1,
                  justifyContent: "center",
                  ...StyleSheet.absoluteFillObject,
                }}
              >
                <LoadingIndicator color="darkgray" />
              </View>
            )}
          />
        </SlideUp>
        <SlideUp ref={ellipsizeSlideUpRef} withHandle={false}>
          <SlideUpButton type="share" onPress={share} />
          <SlideUpButton type="open_in_browser" onPress={openInBrowser} />
          <SlideUpButton type="copy" title="Copy Link" onPress={copy} />
          <SlideUpButton type="close" onPress={closeEllipsizeSlideUp} />
        </SlideUp>
      </>
    );
  }
);

export default WebViewSlideUp;
