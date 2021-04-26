import {
  cleanOutgoingText,
  launchShare,
  popup,
  scrollToEnd,
  showBanner,
  truncateThousand,
  defaultUser,
  User,
} from "../../utils";
import {
  Avatar,
  BlockUserSlideUp,
  Chat,
  ChatTextInput,
  DurationIndicator,
  GoBackButton,
  Icon,
  LoadingIndicator,
  ReportUserSlideUp,
  SlideUp,
  SlideUpButton,
  SlideUpButtonBase,
  Text,
  VideoBox,
  HelpFeedbackSlideUp,
} from "../../components";
import {
  GlobalContext,
  SocketContext,
  StreamContext,
  ThemeContext,
} from "../../contexts";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  shadowBox,
  statusBarHeight,
  appName,
  successColor,
  errorColor,
} from "../../constants";
import { useOrientation, useSlideUp, useRequest } from "../../hooks";

import LiveIndicator from "../../components/Miscellaneous/LiveIndicator";
import { HomeStackNavProps } from "../../navigation";
import Orientation from "react-native-orientation-locker";
import { debounce } from "lodash";
import { StreamEventListenersEnum } from "../../contexts/events";

type Props = HomeStackNavProps<"ViewLiveStream">;

interface State {
  commentInput: string;
  recentlyPressedVideoBox: boolean;
  showMessages: boolean;
  showMetadata: boolean;
  focusedUser: User;
  duration: number;
  isFollowing: boolean;
  followingLoading: boolean;
}

const initialState: State = {
  recentlyPressedVideoBox: false,
  showMetadata: true,
  showMessages: true,
  duration: 0,
  commentInput: "",
  focusedUser: defaultUser,
  isFollowing: false,
  followingLoading: false,
};

const ViewLiveStream = (props: Props) => {
  const global = useContext(GlobalContext);
  const streamContext = useContext(StreamContext);
  const socketContext = useContext(SocketContext);
  const [request] = useRequest();

  const [state, setState] = useState({ ...initialState });

  const [orientationState] = useOrientation({
    onDeviceOrientationChangeCallBack: (newOrientation) => {
      Orientation.getAutoRotateState((orientationLockSettingDisabled) => {
        if (!orientationLockSettingDisabled) return;
        else {
          if (newOrientation === "LANDSCAPE-LEFT") {
            Orientation.lockToLandscapeLeft();
          } else if (newOrientation === "LANDSCAPE-RIGHT") {
            Orientation.lockToLandscapeRight();
          } else if (newOrientation === "PORTRAIT") {
            Orientation.lockToPortrait();
          }
        }
      });
    },
  });

  const recentlyPressedTimerRef: any = useRef(null);
  const chatRef: any = useRef(null);

  const [
    helpFeedbackSlideUp,
    openHelpFeedbackSlideUp,
    closeHelpFeedbackSlideUp,
  ] = useSlideUp();
  const [
    userMenuRef,
    onOpenUserMenuSlideUp,
    onCloseUserMenuSlideUp,
  ] = useSlideUp();
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

  const {
    backgroundColor,
    chatTextInputPlaceholderColor,
    borderColor,
    chatTextInputBackgroundColor,
  } = useContext(ThemeContext);

  useEffect(() => {
    scrollToEnd(chatRef, 1000);
    return () => {
      clearTimeout(recentlyPressedTimerRef);
    };
  }, []);

  useEffect(() => {
    setState((state) => ({
      ...state,
      isFollowing: streamContext.state.streamData?.isFollowing,
    }));
  }, [streamContext.state?.streamData.isFollowing]);

  // Handle socket event listeners
  useEffect(() => {
    socketContext.turnOnStreamListener(
      StreamEventListenersEnum.stream_error,
      overrideStreamError
    );
    socketContext.turnOnStreamListener(
      StreamEventListenersEnum.stream_complete,
      overrideStreamComplete
    );
    return () => {
      socketContext.turnOffStreamListener(
        StreamEventListenersEnum.stream_error,
        overrideStreamError
      );
      socketContext.turnOffStreamListener(
        StreamEventListenersEnum.stream_complete,
        overrideStreamComplete
      );
      streamContext.leaveStream();
      Orientation.lockToPortrait();
    };
  }, []);

  useEffect(() => {
    scrollToEnd(chatRef);
  }, [streamContext.state.messages]);

  const focusedUserIsStreamer =
    state.focusedUser?.username === streamContext.state?.streamData.username;

  const deviceId = streamContext.state.streamData?.remoteDeviceId;

  const overrideStreamComplete = () => {
    streamContext.streamComplete();
    props.route.params?.removeStream(deviceId);
    showBanner({ message: "This stream has been ended." });
    leaveStream();
  };

  const overrideStreamError = ({ type }: { type: string }) => {
    switch (type) {
      case "stream_not_available": {
        props.route.params?.removeStream(deviceId);
        streamContext.streamNotAvailable();
        showBanner({ message: "This stream is currently not available." });
        leaveStream();
        break;
      }
      case "streamer_block_viewer": {
        props.route.params?.removeStream(deviceId);
        streamContext.cleanup();
        showBanner({ message: "You have been kicked out of this stream." });
        leaveStream();
        break;
      }
    }
  };

  const share = async () => {
    await launchShare({
      title: streamContext.state.streamData.username
        ? `${streamContext.state.streamData.username}'s stream`
        : `Live Stream on ${appName}`,
      message: `Join ${
        streamContext.state.streamData.username
          ? `${streamContext.state.streamData.username}'s live stream on ${appName}!`
          : `this stream with me on ${appName}`
      }`,
      type: "toViewLiveStream",
      deepLinkArgs: {
        deviceId: streamContext.state.streamData.remoteDeviceId,
      },
    });
  };

  const onPressVideoBox = () => {
    Keyboard.dismiss();
    const { recentlyPressedVideoBox } = state;
    if (recentlyPressedVideoBox) {
      clearTimeout(recentlyPressedTimerRef.current);
      setState({ ...state, recentlyPressedVideoBox: false });
    } else {
      setState({ ...state, recentlyPressedVideoBox: true });
      clearTimeout(recentlyPressedTimerRef.current);
      recentlyPressedTimerRef.current = setTimeout(() => {
        setState({ ...state, recentlyPressedVideoBox: false });
      }, 5000);
    }
  };

  const toggleupvote = debounce(() => {
    Keyboard.dismiss();
    streamContext.streamReaction({
      type: "upvote",
      set: streamContext.state.reactionToggled.upvote ? false : true,
    });
  }, 500);

  const toggledownvote = debounce(() => {
    Keyboard.dismiss();
    streamContext.streamReaction({
      type: "downvote",
      set: streamContext.state.reactionToggled.downvote ? false : true,
    });
  }, 500);

  const toggleShowMetadata = () => {
    Keyboard.dismiss();
    const { showMetadata } = state;
    setState({ ...state, showMetadata: !showMetadata });
  };

  const submitComment = async () => {
    Keyboard.dismiss();
    const [cleanedText, error] = cleanOutgoingText({
      text: state.commentInput,
      restrictProfane: false,
    });
    if (error === "too_short") {
      return showBanner({
        message: "Comments can't be blank.",
        type: "danger",
      });
    }
    setState({
      ...state,
      commentInput: "",
    });

    const { username, avatar } = global.state;
    streamContext.streamMessage({
      message: cleanedText,
      username,
      avatar,
    });
    scrollToEnd(chatRef);
  };

  const onPressMessage = debounce((focusedUser: User) => {
    setState({ ...state, focusedUser });
    onOpenUserMenuSlideUp();
  }, 1000);

  const leaveStream = () => {
    props.navigation.goBack();
  };

  const toggleFollow = debounce(async () => {
    const response = await request({
      url: "/user/followers",
      method: state.isFollowing ? "DELETE" : "POST",
      body: { username: streamContext.state.streamData.username },
    });
    setState({ ...state, followingLoading: false });
    if (response.ok) {
      setState(({ isFollowing: prevIsFollowing }) => ({
        ...state,
        isFollowing: !prevIsFollowing,
      }));
      showBanner({
        message: `You are now ${
          state.isFollowing ? "not following" : "following"
        } ${streamContext.state.streamData.username}!`,
        type: "success",
      });
    }
  }, 2000);

  const onSubmitReportUser = () => {
    if (focusedUserIsStreamer) {
      onCloseReportUserSlideUp();
      props.route.params?.removeStream(deviceId);
      leaveStream();
    }
  };

  const onSubmitBlockUser = () => {
    if (focusedUserIsStreamer) {
      onCloseBlockUserSlideUp();
      props.route.params?.removeStream(deviceId);
      leaveStream();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: "black",
        paddingTop: orientationState.orientationIsLandscape
          ? 0
          : (Platform.OS === "ios" ? statusBarHeight : 0) +
            (Platform.OS === "android" ? 0 : 10),
      }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Video Stream */}
      <View
        style={{
          height: orientationState.orientationIsLandscape ? "100%" : "30%",
          justifyContent: !streamContext.state.remoteStreamURL
            ? "center"
            : "flex-start",
        }}
      >
        <TouchableOpacity
          onPress={onPressVideoBox}
          activeOpacity={1}
          style={[
            {
              ...StyleSheet.absoluteFillObject,
              zIndex: 2,
              padding: orientationState.orientationIsLandscape ? 15 : 10,
              justifyContent: "space-between",
            },
            orientationState.orientationIsLandscape ? {} : { paddingTop: 0 },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingTop: 10,
            }}
          >
            {state.recentlyPressedVideoBox && (
              <>
                <View>
                  <GoBackButton
                    style={{ paddingRight: 20 }}
                    size={28}
                    onPress={() => {
                      popup({
                        title: "Are you sure you'd like to leave?",
                        buttonOptions: [
                          { text: "Cancel" },
                          {
                            text: "Leave",
                            style: "destructive",
                            onPress: leaveStream,
                          },
                        ],
                      });
                    }}
                  />
                </View>
                <View>
                  <LiveIndicator />
                </View>
              </>
            )}
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <DurationIndicator
              style={{
                color: state.recentlyPressedVideoBox
                  ? "rgba(255,255,255, 0.8)"
                  : "transparent",
                alignSelf: "center",
              }}
            />
            {state.recentlyPressedVideoBox && (
              <TouchableOpacity
                style={{ alignSelf: "flex-end" }}
                onPress={debounce(() => {
                  if (orientationState.orientationIsLandscape)
                    Orientation.lockToPortrait();
                  else Orientation.lockToLandscape();
                }, 500)}
              >
                <Icon
                  size={24}
                  color="white"
                  library="ionicons"
                  name={`md-${
                    orientationState.orientationIsLandscape
                      ? "contract"
                      : "expand"
                  }`}
                />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
        <VideoBox
          streamURL={streamContext.state.remoteStreamURL}
          style={{ flex: 1 }}
          paused={streamContext.state.streamData?.videoPaused}
          type="view-live-stream"
          objectFit={
            streamContext.state.streamData?.deviceOrientation === "portrait"
              ? "contain"
              : "cover"
          }
          LoadingComponent={
            <View style={{ justifyContent: "center", flexDirection: "row" }}>
              <LoadingIndicator />
              <Text a="center" style={{ marginLeft: 10 }}>
                Connecting...
              </Text>
            </View>
          }
        />
      </View>

      {!orientationState.orientationIsLandscape && (
        <View style={{ flex: 1 }}>
          <View>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                backgroundColor: chatTextInputBackgroundColor,
                padding: 15,
              }}
              onPress={toggleShowMetadata}
            >
              <View
                style={{
                  flexDirection: "row",
                  flex: 1,
                  alignSelf: "flex-start",
                }}
              >
                <View>
                  <Avatar
                    avatar={streamContext.state.streamData.avatar}
                    style={{ width: 30, height: 30 }}
                  />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text w="bold" s="xxl" ellipsizeMode="tail" numberOfLines={2}>
                    {streamContext.state.streamData.title}
                  </Text>
                  <Text
                    s="lg"
                    w="semiBold"
                    ellipsizeMode="tail"
                    numberOfLines={1}
                  >
                    {streamContext.state.streamData.username}
                  </Text>
                </View>
              </View>
              <View style={{ alignSelf: "flex-start", paddingLeft: 10 }}>
                <Icon
                  library="ionicons"
                  name={`${Platform.OS === "ios" ? "ios" : "md"}-${
                    state.showMetadata ? "arrow-down" : "arrow-back"
                  }`}
                  size={24}
                />
              </View>
            </TouchableOpacity>
            {state.showMetadata && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  paddingVertical: 10,
                  backgroundColor: chatTextInputBackgroundColor,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: borderColor,
                }}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", paddingHorizontal: 20 }}>
                    <TouchableOpacity
                      style={{
                        marginHorizontal: 5,
                        paddingHorizontal: 20,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      onPress={toggleupvote}
                    >
                      <Icon
                        library="ionicons"
                        name={`${
                          Platform.OS === "ios" ? "ios" : "md"
                        }-thumbs-up`}
                        color={
                          streamContext.state.reactionToggled.upvote
                            ? successColor
                            : "lightgray"
                        }
                        size={28}
                      />
                      <Text w="bold" s="sm" a="center" style={{ marginTop: 5 }}>
                        {truncateThousand(
                          streamContext.state.streamData.upvote
                        )}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        marginHorizontal: 5,
                        paddingHorizontal: 20,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      onPress={toggledownvote}
                    >
                      <Icon
                        library="ionicons"
                        name={`${
                          Platform.OS === "ios" ? "ios" : "md"
                        }-thumbs-down`}
                        color={
                          streamContext.state.reactionToggled.downvote
                            ? errorColor
                            : "lightgray"
                        }
                        size={28}
                      />
                      <Text w="bold" s="sm" a="center" style={{ marginTop: 5 }}>
                        {truncateThousand(
                          streamContext.state.streamData.downvote
                        )}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        marginHorizontal: 5,
                        paddingHorizontal: 20,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      onPress={share}
                    >
                      <Icon
                        library="ionicons"
                        name={`${Platform.OS === "ios" ? "ios" : "md"}-share`}
                        size={28}
                        color={"lightgray"}
                      />
                      <Text w="bold" s="sm" a="center" style={{ marginTop: 5 }}>
                        Share
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        marginHorizontal: 5,
                        paddingHorizontal: 20,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      onPress={() => {
                        const {
                          username,
                          avatar,
                        } = streamContext.state.streamData;
                        setState({
                          ...state,
                          focusedUser: { username, avatar },
                        });
                        onOpenReportUserSlideUp();
                      }}
                    >
                      <Icon
                        name={`${Platform.OS === "ios" ? "ios" : "md"}-flag`}
                        library="ionicons"
                        size={28}
                        color={"lightgray"}
                      />
                      <Text w="bold" s="sm" a="center" style={{ marginTop: 5 }}>
                        Report
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        marginHorizontal: 5,
                        paddingHorizontal: 20,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      onPress={async () => {
                        setState({ ...state, followingLoading: true });
                        await toggleFollow();
                      }}
                    >
                      {state.followingLoading && (
                        <View
                          style={{
                            position: "absolute",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(0,0,0,0.7)",
                          }}
                        >
                          <LoadingIndicator />
                        </View>
                      )}
                      <Icon
                        name={`${state.isFollowing ? "minus" : "plus"}-box`}
                        library="materialComIcons"
                        size={28}
                        color={"lightgray"}
                      />
                      <Text w="bold" s="sm" a="center" style={{ marginTop: 5 }}>
                        {state.isFollowing ? "Unfollow" : "Follow"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
          {/* Live Chat */}
          <View
            style={{
              flex: 1,
              backgroundColor,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: borderColor,
            }}
          >
            <TouchableOpacity
              onPress={() =>
                setState({ ...state, showMessages: !state.showMessages })
              }
              style={{
                flexDirection: "row",
                backgroundColor: chatTextInputBackgroundColor,
                alignItems: "center",
                paddingHorizontal: 15,
                paddingVertical: 10,
                justifyContent: "space-between",
                ...shadowBox,
              }}
            >
              <View>
                <Text w="semiBold">Live chat</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Icon
                    library="materialComIcons"
                    name="account-circle"
                    size={16}
                    color={chatTextInputPlaceholderColor}
                  />
                  <Text s="sm" style={{ marginLeft: 5 }}>
                    {streamContext.state.numViewers}
                  </Text>
                </View>
                <View style={{ marginLeft: 20 }}>
                  <Icon
                    library="ionicons"
                    name={`${Platform.OS === "ios" ? "ios" : "md"}-${
                      state.showMessages ? "arrow-down" : "arrow-back"
                    }`}
                    size={24}
                  />
                </View>
              </View>
            </TouchableOpacity>
            {state.showMessages ? (
              <Chat
                ref={chatRef}
                streamOwner={streamContext.state.streamData.username}
                flatListStyle={{ paddingBottom: 20 }}
                messages={streamContext.state.messages}
                onPressMessage={onPressMessage}
              />
            ) : (
              <Text a="center" s="lg" style={{ marginTop: 50 }}>
                Messages are currently hidden.
              </Text>
            )}
          </View>
          <ChatTextInput
            style={{ paddingBottom: 20 }}
            value={state.commentInput}
            submit={submitComment}
            maxLength={200}
            onChangeText={(commentInput) =>
              setState({ ...state, commentInput })
            }
          />
        </View>
      )}

      <SlideUp ref={userMenuRef}>
        <SlideUpButtonBase
          title={state.focusedUser.username}
          IconComponent={
            <Avatar
              style={{ width: 25, height: 25 }}
              avatar={state.focusedUser.avatar}
            />
          }
        />
        {state.focusedUser.username !== global.state.username && (
          <>
            <SlideUpButton onPress={onOpenReportUserSlideUp} type="report" />
            <SlideUpButton onPress={onOpenBlockUserSlideUp} type="block" />
          </>
        )}
        <SlideUpButton
          type="help_feedback"
          title="Help or Feedback"
          onPress={() => {
            onCloseUserMenuSlideUp();
            openHelpFeedbackSlideUp();
          }}
        />
        <SlideUpButton onPress={onCloseUserMenuSlideUp} type="close" />
      </SlideUp>
      <HelpFeedbackSlideUp
        ref={helpFeedbackSlideUp}
        onCancel={closeHelpFeedbackSlideUp}
        onSubmit={closeHelpFeedbackSlideUp}
      />
      <BlockUserSlideUp
        ref={blockUserRef}
        onCancel={onCloseBlockUserSlideUp}
        onSubmit={onSubmitBlockUser}
        username={state.focusedUser.username}
      />
      <ReportUserSlideUp
        ref={reportUserRef}
        onCancel={onCloseReportUserSlideUp}
        onSubmit={onSubmitReportUser}
        type="viewer-reports-streamer"
        reportData={{
          deviceId: streamContext.state.streamData.remoteDeviceId,
        }}
        username={streamContext.state.streamData.username}
      />
    </KeyboardAvoidingView>
  );
};

export default ViewLiveStream;
