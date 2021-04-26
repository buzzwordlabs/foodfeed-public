import { Image, ImageStyle, StyleSheet, View, ViewStyle } from "react-native";
import { RTCView, RTCViewProps } from "react-native-webrtc";

import { LoadingIndicator } from "../Primitives";
import React from "react";
import { window } from "../../constants";
import { Text } from "../../components/Primitives";

type CustomProps = {
  streamURL?: string;
  type?: "remote" | "local" | "view-live-stream" | "manage-live-stream";
  placeholder?: boolean;
  placeholderURI?: string;
  style?: ViewStyle;
  frontCamera?: boolean;
  LoadingComponent?: React.ReactNode;
  paused?: boolean;
  BackgroundComponent?: React.ReactNode;
};

type Props = Omit<RTCViewProps, "streamURL"> & CustomProps;

const VideoBox = (props: Props) => {
  const {
    streamURL,
    type,
    placeholder,
    placeholderURI,
    frontCamera,
    style,
    LoadingComponent,
    BackgroundComponent,
    paused,
    zOrder,
  } = props;

  const resolveRTCViewStyle = () => {
    switch (type) {
      case "remote":
        return styles.remoteBox;
      case "local":
        return styles.localBox;
      case "view-live-stream":
        return styles.viewLiveStreamBox;
      case "manage-live-stream":
        return styles.manageLiveStreamBox;
      default:
        return {};
    }
  };

  const resolveOverlayComponent = () => {
    if (BackgroundComponent) return BackgroundComponent;
    switch (type) {
      case "remote":
        return (
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              top: -20,
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0, 0.6)",
              zIndex: 1,
            }}
          >
            <Text a="center" w="bold" s="header">
              Paused...
            </Text>
          </View>
        );
      case "local":
        return (
          <View
            style={[
              styles.localBox,
              {
                position: "absolute",
                zIndex: 1,
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.7)",
                right: 0,
              },
            ]}
          >
            <Text a="center" w="bold">
              Paused...
            </Text>
          </View>
        );
      case "view-live-stream":
        return (
          <View
            style={[
              {
                ...StyleSheet.absoluteFillObject,
                position: "absolute",
                zIndex: 1,
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.7)",
              },
            ]}
          >
            <Text a="center" w="bold">
              Paused...
            </Text>
          </View>
        );
      case "manage-live-stream":
        return (
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              top: -20,
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0, 0.6)",
              zIndex: 1,
            }}
          >
            <Text a="center" w="bold" s="header">
              Paused...
            </Text>
          </View>
        );
      default:
        return <></>;
    }
  };

  if (placeholder) {
    return (
      <Image
        style={[resolveRTCViewStyle(), (style as ImageStyle) || {}]}
        source={{ uri: placeholderURI }}
      />
    );
  }
  if (!streamURL) {
    return (
      <View style={[resolveRTCViewStyle(), { justifyContent: "center" }]}>
        {LoadingComponent || <LoadingIndicator style={{ marginBottom: 10 }} />}
      </View>
    );
  } else {
    return (
      <>
        {paused && resolveOverlayComponent()}
        <RTCView
          streamURL={streamURL}
          style={[resolveRTCViewStyle(), style || {}]}
          objectFit="cover"
          mirror={frontCamera}
          {...props}
          zOrder={zOrder ?? 0}
        />
      </>
    );
  }
};

const styles = StyleSheet.create({
  localBox: {
    width: window.width * 0.25,
    height: window.height * 0.2,
    backgroundColor: "black",
    borderRadius: 10,
    alignSelf: "flex-end",
    marginRight: 10,
    marginTop: 10,
  },
  remoteBox: {
    height: window.height,
    width: window.width,
    backgroundColor: "black",
    top: 0,
    borderRadius: 15,
  },
  viewLiveStreamBox: {
    minHeight: window.height * 0.275,
    maxHeight: window.height * 0.275,
    width: window.width,
  },
  manageLiveStreamBox: {
    height: window.height,
    width: window.width,
  },
});

export default VideoBox;
