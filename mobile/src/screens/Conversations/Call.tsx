import { popup, showBanner } from "../../utils";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import FastImage from "react-native-fast-image";
import {
  Avatar,
  BlockUserSlideUp,
  Icon,
  LoadingIndicator,
  ReportUserSlideUp,
  StatusBar,
  Text,
  VideoBox,
  SlideUp,
  SlideUpButton,
  CallDurationIndicator,
  HelpFeedbackSlideUp,
} from "../../components";
import { CallContext, SocketContext } from "../../contexts";
import React, { useContext, useEffect, useRef, useState } from "react";
import { statusBarHeight, window } from "../../constants";

import {
  ConversationsStackNavProps,
  CreateStackNavProps,
} from "../../navigation";
import { IconProps } from "../../components/Primitives/Icon";
import { logoRectangleTransparent } from "../../assets";
import { useSlideUp, useRequest, useAppState } from "../../hooks";
import { CallEventListenersEnum } from "../../contexts/events";
import { debounce } from "lodash";

type Props = CreateStackNavProps<"Call">;

interface FooterButtonProps {
  onPress: () => void;
  iconProps: IconProps;
  style?: ViewStyle;
}

interface State {
  recentlyPressed: boolean;
  facingFront: boolean;
  isFollowing: boolean;
}

const initialState: State = {
  recentlyPressed: false,
  facingFront: true,
  isFollowing: false,
};

const Room = (props: Props) => {
  const callContext = useContext(CallContext);
  const socketContext = useContext(SocketContext);
  const [request] = useRequest();
  const [state, setState] = useState(initialState);
  const [currentAppState, prevAppState] = useAppState();
  const recentlyPressedTimer: any = useRef(null);
  const [
    reportUserRef,
    onOpenReportUserSlideUp,
    onCloseReportUserSlideUp,
  ] = useSlideUp();
  const [
    blockUserRef,
    onOpenBlockUserSlideUp,
    onCloseBlockUserSlideUp,
  ] = useSlideUp();

  const [optionsRef, openOptions, closeOptions] = useSlideUp();

  const [
    helpFeedbackSlideUp,
    openHelpFeedbackSlideUp,
    closeHelpFeedbackSlideUp,
  ] = useSlideUp();

  useEffect(() => {
    setState((state) => ({
      ...state,
      isFollowing: callContext.state.remoteUserInfo?.isFollowing,
    }));
  }, [callContext.state.remoteUserInfo?.isFollowing]);

  useEffect(() => {
    if (currentAppState === "background") {
      callContext.appInBackground();
    } else if (currentAppState === "active") {
      if (prevAppState === "background") {
        callContext.appReturnedToForeground();
      }
    }
  }, [currentAppState]);

  useEffect(() => {
    socketContext.turnOnCallListener(
      CallEventListenersEnum.remote_user_disconnected,
      overrideRemoteEndCall
    );
    socketContext.turnOnCallListener(
      CallEventListenersEnum.call_unknown_error,
      unknownCallErrorOverride
    );

    // yes, this is supposed to be off, do not change this
    socketContext.state.socket.off(
      "number_online_users_in_waiting_room",
      callContext.numberOnlineUsersInWaitingRoom
    );
    return () => {
      clearTimeout(recentlyPressedTimer.current);
      if (callContext.getCallPresent()) {
        callContext.localEndCall();
      }
      socketContext.turnOffCallListener(
        CallEventListenersEnum.remote_user_disconnected,
        overrideRemoteEndCall
      );
      socketContext.turnOffCallListener(
        CallEventListenersEnum.call_unknown_error,
        unknownCallErrorOverride
      );
      // Yes, this is supposed to be on, do not change this
      socketContext.state.socket.on(
        "number_online_users_in_waiting_room",
        callContext.numberOnlineUsersInWaitingRoom
      );
    };
  }, []);

  const overrideRemoteEndCall = () => {
    if (callContext.getCallPresent()) {
      callContext.remoteEndCall();
      callContext.joinedWaitingRoom();
      props.navigation.goBack();
    }
  };

  const unknownCallErrorOverride = () => {
    callContext.unknownCallError();
    props.navigation.goBack();
  };

  const pressed = () => {
    const { recentlyPressed } = state;
    if (recentlyPressed) {
      clearTimeout(recentlyPressedTimer.current);
      setState((state) => ({ ...state, recentlyPressed: false }));
    } else {
      setState((state) => ({ ...state, recentlyPressed: true }));
      clearTimeout(recentlyPressedTimer.current);
      recentlyPressedTimer.current = setTimeout(() => {
        setState((state) => ({ ...state, recentlyPressed: false }));
      }, 5000);
    }
  };

  const toggleFollow = debounce(async () => {
    closeOptions();
    const response = await request({
      url: "/user/followers",
      method: state.isFollowing ? "DELETE" : "POST",
      body: { username: callContext.state.remoteUserInfo?.username },
    });

    if (response.ok) {
      showBanner({
        message: `You ${state.isFollowing ? "unfollowed" : "followed"} ${
          callContext.state.remoteUserInfo?.username
        }!`,
        type: "success",
      });
      setState(({ isFollowing: prevIsFollowing }) => ({
        ...state,
        isFollowing: !prevIsFollowing,
      }));
    }
  }, 500);

  const renderHeader = () => {
    return (
      <View
        style={{
          maxHeight: window.height * 0.2,
          maxWidth: window.width - window.width * 0.3,
          flex: 1,
          top: Platform.OS === "ios" ? statusBarHeight : 10,
          padding: 10,
          borderBottomRightRadius: 10,
          flexDirection: "column",
          zIndex: 4,
          position: "absolute",
        }}
      >
        <View style={{ flexDirection: "row" }}>
          <View style={{ alignItems: "center" }}>
            <Avatar
              avatar={callContext.state.remoteUserInfo.avatar}
              style={{ borderRadius: 30, width: 30, height: 30, marginLeft: 5 }}
            />
          </View>
          <View style={{ marginLeft: 10 }}>
            {callContext.state.remoteUserInfo.username ? (
              <Text style={styles.overlayText} s="xl" w="bold">
                {callContext.state.remoteUserInfo.username}
              </Text>
            ) : (
              <ActivityIndicator size="small" color={"white"} animating />
            )}
          </View>
        </View>
      </View>
    );
  };

  const endCall = () => {
    if (callContext.getCallPresent()) {
      callContext.localEndCall();
      callContext.joinedWaitingRoom();
      props.navigation.goBack();
    }
  };

  const renderFooter = () => {
    const { isMuted } = callContext.state;

    const FooterButton = ({ onPress, iconProps, style }: FooterButtonProps) => (
      <TouchableOpacity onPress={onPress}>
        <View style={{ ...styles.footerButton, ...style }}>
          <Icon {...iconProps} />
        </View>
      </TouchableOpacity>
    );

    return (
      <View style={styles.footer}>
        <FooterButton
          onPress={callContext.toggleLocalVideo}
          iconProps={{
            library: "materialComIcons",
            name: callContext.state.isLocalVideoPaused ? "video-off" : "video",
            size: 36,
            color: "white",
          }}
        />

        <FooterButton
          onPress={callContext.toggleAudio}
          iconProps={{
            name: isMuted ? "microphone-off" : "microphone",
            library: "materialComIcons",
            size: 35,
            color: "white",
          }}
        />
        <FooterButton
          onPress={callContext.flipCamera}
          iconProps={{
            library: "materialComIcons",
            name: "sync",
            size: 35,
            color: "white",
          }}
        />
        <FooterButton
          onPress={() =>
            popup({
              title: `End call${
                callContext.state.remoteUserInfo?.username &&
                ` with ${callContext.state.remoteUserInfo?.username}`
              }?`,
              description: "This is not reversible.",
              buttonOptions: [
                { text: "Cancel", onPress: () => {} },
                {
                  text: "End Call",
                  style: "destructive",
                  onPress: endCall,
                },
              ],
            })
          }
          iconProps={{
            library: "antdesign",
            name: "close",
            color: "white",
            size: 30,
          }}
        />
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.wrapper, { backgroundColor: "#2f3031" }]}
      onPress={pressed}
      activeOpacity={1}
    >
      <StatusBar
        hidden={Platform.OS === "ios" && !state.recentlyPressed}
        barStyle="light-content"
      />
      {/* Remote */}
      <VideoBox
        streamURL={callContext.state.remoteStreamURL}
        type="remote"
        paused={callContext.state.remoteVideoPaused}
        LoadingComponent={
          <View>
            <LoadingIndicator />
            <Text a="center" style={{ marginTop: 10 }}>
              Connecting...
            </Text>
          </View>
        }
      />
      {/* Local */}
      <View style={styles.callerBoxWrapper}>
        <VideoBox
          zOrder={1}
          streamURL={callContext.state.localStreamURL}
          type="local"
          paused={callContext.state.isLocalVideoPaused}
          LoadingComponent={
            <View>
              <LoadingIndicator />
              <Text a="center" s="xs" style={{ marginTop: 10 }}>
                Connecting...
              </Text>
            </View>
          }
        />
        {state.recentlyPressed && (
          <TouchableOpacity
            style={{
              marginTop: 20,
              alignSelf: "flex-end",
              flexDirection: "row",
            }}
            onPress={() =>
              callContext.state.remoteUserInfo?.username && openOptions()
            }
          >
            <Icon
              library="materialComIcons"
              name="dots-vertical"
              size={32}
              color="white"
            />
          </TouchableOpacity>
        )}
      </View>

      <CallDurationIndicator
        textStyle={{
          ...styles.overlayText,
          position: "absolute",
          top: window.height * 0.9,
          alignSelf: "center",
          zIndex: 10,
          color: state.recentlyPressed ? "white" : "transparent",
        }}
        duration={callContext.state.callDuration}
      />

      {state.recentlyPressed && (
        <>
          {renderHeader()}
          {renderFooter()}
          <FastImage
            style={{
              position: "absolute",
              bottom: 0,
              right: 20,
              zIndex: 2,
              width: 75,
              height: 50,
            }}
            resizeMode="contain"
            source={logoRectangleTransparent}
          />
        </>
      )}

      <SlideUp ref={optionsRef}>
        <SlideUpButton
          onPress={toggleFollow}
          type={state.isFollowing ? "unfollow" : "follow"}
        />
        <SlideUpButton onPress={onOpenBlockUserSlideUp} type="block" />
        <SlideUpButton onPress={onOpenReportUserSlideUp} type="report" />
        <SlideUpButton onPress={endCall} type="end_call" title="End call" />
        <SlideUpButton
          type="help_feedback"
          title="Help or Feedback"
          onPress={() => {
            closeOptions();
            openHelpFeedbackSlideUp();
          }}
        />
        <SlideUpButton onPress={closeOptions} type="close" />
      </SlideUp>

      <HelpFeedbackSlideUp
        ref={helpFeedbackSlideUp}
        onCancel={closeHelpFeedbackSlideUp}
        onSubmit={closeHelpFeedbackSlideUp}
      />
      <BlockUserSlideUp
        ref={blockUserRef}
        username={callContext.state.remoteUserInfo?.username}
        onSubmit={() => {
          endCall();
          onCloseBlockUserSlideUp();
        }}
        onCancel={onCloseBlockUserSlideUp}
      />
      <ReportUserSlideUp
        ref={reportUserRef}
        onCancel={onCloseReportUserSlideUp}
        onSubmit={() => {
          endCall();
          onCloseReportUserSlideUp();
        }}
        reportData={{ callId: callContext.state.callId }}
        type="call"
        username={callContext.state.remoteUserInfo.username}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "black",
    height: window.height,
    zIndex: 4,
  },
  header: {
    height: window.height * 0.11,
    width: window.width,
    marginTop: -statusBarHeight,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "flex-end",
  },
  videoBox: {
    width: window.width * 0.25,
    height: window.height * 0.2,
    backgroundColor: "black",
    borderRadius: 10,
    position: "absolute",
    right: 10,
  },
  headerTitle: {
    marginBottom: 10,
    marginLeft: 10,
    color: "darkgray",
  },
  footer: {
    height: window.height * 0.2 - statusBarHeight,
    width: window.width,
    position: "absolute",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexDirection: "row",
    bottom: 0,
    paddingHorizontal: 10,
    paddingBottom: 20,
    zIndex: 3,
  },
  footerButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 55,
    height: 55,
  },
  overlayText: {
    color: "rgba(255,255,255, 0.8)",
  },
  callerBoxWrapper: {
    height: window.height,
    width: window.width,
    position: "absolute",
    top: Platform.OS === "ios" ? statusBarHeight : 10,
    borderRadius: 15,
    zIndex: 3,
    flex: 1,
  },
  callerBox: {
    width: window.width * 0.25,
    height: window.height * 0.2,
    backgroundColor: "black",
    borderRadius: 10,
    alignSelf: "flex-end",
    marginRight: 10,
    marginTop: 10,
  },
  calleeBox: {
    height: window.height,
    width: window.width,
    backgroundColor: "black",
    top: 0,
    borderRadius: 15,
    zIndex: 2,
  },
});

export default Room;
