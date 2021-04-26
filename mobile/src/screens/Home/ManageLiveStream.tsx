import {
  cleanOutgoingText,
  popup,
  scrollToEnd,
  showBanner,
  truncateThousand,
  launchShare,
  sessionId,
  User,
} from "../../utils";
import {
  Avatar,
  BlockUserSlideUp,
  ChatTextInput,
  DurationIndicator,
  Icon,
  ReportUserSlideUp,
  SlideUp,
  SlideUpButton,
  SlideUpButtonBase,
  StatusBar,
  Text,
  VideoBox,
  VideoIconButton,
  LoadingIndicator,
  ProfileItem,
  HelpFeedbackSlideUp,
} from "../../components";
import { GlobalContext, StreamContext, ThemeContext } from "../../contexts";
import {
  Keyboard,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  RefreshControl,
} from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  statusBarHeight,
  window,
  defaultHorizontalInset,
  appName,
  successColor,
  errorColor,
} from "../../constants";
import {
  useOrientation,
  useSlideUp,
  useDisappearingView,
  useRequest,
  useAppState,
} from "../../hooks";

import Chat from "../../components/Chat/Chat";
import { HomeStackNavProps, CreateStackNavProps } from "../../navigation";
import Orientation from "react-native-orientation-locker";
import { debounce } from "lodash";

type Props = CreateStackNavProps<"ManageLiveStream">;

interface Viewer {
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

interface State {
  commentInput: string;
  hideBottomButtons: boolean;
  focusedUser: User & { isFollowing?: boolean };
  recentlyPressedOverlay: boolean;
  loadingAudience: boolean;
  viewers: Viewer[];
  page: number;
  reachedEnd: boolean;
  paginationLoading: boolean;
  pageSize: number;
  numViewers: number;
  refreshing: boolean;
  followingLoading: boolean;
}

const initialState: State = {
  recentlyPressedOverlay: false,
  focusedUser: {} as User,
  commentInput: "",
  hideBottomButtons: false,
  loadingAudience: true,
  viewers: [],
  numViewers: 0,
  pageSize: 20,
  page: 1,
  reachedEnd: false,
  paginationLoading: false,
  refreshing: false,
  followingLoading: false,
};

const ManageLiveStream = (props: Props) => {
  const global = useContext(GlobalContext);
  const { textColor } = useContext(ThemeContext);
  const { streamTitle } = props.route.params;
  const streamContext = useContext(StreamContext);
  const [state, setState] = useState(initialState);
  const [request] = useRequest();

  const [messagesRef, openMessagesSlideUp, closeMessagesSlideUp] = useSlideUp();
  const [userMenuRef, openUserMenuSlideUp, closeUserMenuSlideUp] = useSlideUp();
  const [viewAudienceSlideUpRef, openViewAudienceSlideUp] = useSlideUp();
  const [
    helpFeedbackSlideUp,
    openHelpFeedbackSlideUp,
    closeHelpFeedbackSlideUp,
  ] = useSlideUp();
  const [
    streamOptionsRef,
    openStreamOptions,
    closeStreamOptions,
  ] = useSlideUp();
  const [
    chatOptionsRef,
    openChatOptionsSlideUp,
    closeChatOptionsSlideUp,
  ] = useSlideUp();
  const [
    reportUserRef,
    openReportUserSlideUp,
    closeReportUserSlideUp,
  ] = useSlideUp();
  const [
    blockUserRef,
    openBlockUserSlideUp,
    closeBlockUserSlideUp,
  ] = useSlideUp();
  const [orientationState] = useOrientation();
  const [openingMessageVisible, makeVisible] = useDisappearingView(5000);
  const chatRef: any = useRef(null);
  const [currentAppState, prevAppState] = useAppState();

  useEffect(() => {
    scrollToEnd(chatRef);
  }, [streamContext.state.messages]);

  useEffect(() => {
    if (currentAppState === "background") {
      streamContext.appInBackground();
    } else if (currentAppState === "active") {
      if (prevAppState === "background") {
        streamContext.appReturnedToForeground();
      }
    }
  }, [currentAppState]);

  useEffect(() => {
    (async () => {
      await streamContext.startStream(
        streamTitle,
        orientationState.orientationIsLandscape
      );
      makeVisible();
    })();
    return () => {
      streamContext.endStream();
      Orientation.lockToPortrait();
    };
  }, []);

  useEffect(() => {
    streamContext.orientationChanged(orientationState.orientationIsLandscape);
  }, [orientationState.orientationIsLandscape]);

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

  const openMessages = () => {
    setState({ ...state, hideBottomButtons: true });
    openMessagesSlideUp();
    setTimeout(() => {
      scrollToEnd(chatRef);
    }, 1000);
    closeStreamOptions();
  };

  const onPressUser = async (focusedUser: User) => {
    const { username } = focusedUser;
    const response = await request({
      url: "/user/followers/following-status",
      method: "GET",
      params: { username },
    });
    if (response.ok) {
      setState({
        ...state,
        focusedUser: { ...focusedUser, isFollowing: response.data.isFollowing },
      });
    } else {
      setState({
        ...state,
        focusedUser: { ...focusedUser, isFollowing: undefined },
      });
    }
    openUserMenuSlideUp();
  };

  const endStream = () => {
    closeStreamOptions();
    props.navigation.popToTop();
  };

  const endCallPrompt = () => {
    popup({
      title: "End Stream?",
      description: `You have ${streamContext.state.numViewers} ${
        streamContext.state.numViewers === 1 ? "person" : "people"
      } watching!`,
      buttonOptions: [
        { text: "Cancel", onPress: () => {} },
        {
          text: "End Stream",
          style: "destructive",
          onPress: endStream,
        },
      ],
    });
  };

  const viewAudience = async () => {
    closeStreamOptions();
    openViewAudienceSlideUp();
    await initLoad();
  };

  const initLoad = async () => {
    setState({ ...state, paginationLoading: true });
    const response = await getViewers({
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState({
        ...state,
        page: response.data.page + 1,
        viewers: [...state.viewers, ...response.data.viewers],
        numViewers: response.data.total,
        reachedEnd: response.data.reachedEnd,
        paginationLoading: false,
      });
    } else {
      return setState({ ...state, paginationLoading: false });
    }
  };

  const paginate = async () => {
    if (state.reachedEnd || state.paginationLoading) return;
    setState({ ...state, paginationLoading: true });
    const response = await getViewers({
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState({
        ...state,
        viewers: [...state.viewers, ...response.data.viewers],
        numViewers: response.data.total,
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        paginationLoading: false,
      });
    } else {
      setState({ ...state, paginationLoading: false });
    }
  };

  const getViewers = async (params?: { page: number; pageSize: number }) => {
    return request({
      url: "user/streams/viewers",
      method: "POST",
      body: { ...params, deviceId: sessionId },
    });
  };

  const refresh = async () => {
    setState((state) => ({ ...state, refreshing: true }));

    const response = await getViewers({ page: 1, pageSize: state.pageSize });
    if (response.ok) {
      setState((state) => ({
        ...state,
        page: response.data.page + 1,
        viewers: response.data.viewers,
        numViewers: response.data.total,
        reachedEnd: response.data.reachedEnd,
        refreshing: false,
      }));
    } else {
      setState((state) => ({
        ...state,
        refreshing: false,
      }));
    }
  };

  const removeUserFromViewers = (username: string) => {
    const viewersCopy = state.viewers;
    viewersCopy.splice(
      viewersCopy.findIndex((v) => v.username === username),
      1
    );
    setState((state) => ({ ...state, viewers: viewersCopy }));
  };

  const RefreshControlComponent = () => {
    return (
      <RefreshControl
        refreshing={state.refreshing}
        onRefresh={refresh}
        tintColor={textColor}
      />
    );
  };

  const ListEmptyComponent = () =>
    !state.loadingAudience ? (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ marginTop: 40 }} s="lg" w="bold" a="center">
          Sorry, no viewers yet!
        </Text>
      </View>
    ) : (
      <></>
    );

  const ListFooterComponent = () => {
    if (state.paginationLoading) {
      return <LoadingIndicator style={{ marginVertical: 40 }} />;
    }
    if (state.reachedEnd) {
      return (
        <Text a="center" w="bold" style={{ marginVertical: 20 }}>
          You've reached the 🔚
        </Text>
      );
    }
  };

  const ListHeaderComponent = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-end",
        marginVertical: 10,
      }}
    >
      <View style={{ marginRight: 5 }}>
        <Text s="lg" w="bold">
          {state.numViewers}
        </Text>
      </View>
      <Icon
        library="ionicons"
        name={`${Platform.OS === "ios" ? "ios" : "md"}-people`}
        size={26}
      />
    </View>
  );

  const toggleFollow = debounce(async () => {
    setState({ ...state, followingLoading: true });
    const focusedUser = state.focusedUser;
    const username = focusedUser.username;
    const isFollowing = focusedUser.isFollowing;
    closeUserMenuSlideUp();
    if (isFollowing === undefined) {
      return setState({ ...state, followingLoading: false });
    }
    const response = await request({
      url: "/user/followers",
      method: isFollowing ? "DELETE" : "POST",
      body: { username },
    });
    setState({ ...state, followingLoading: false });
    if (response.ok) {
      setState(({ focusedUser: { isFollowing: prevIsFollowing } }) => {
        showBanner({
          message: `You ${
            prevIsFollowing ? "unfollowed" : "followed"
          } ${username}!`,
          type: "success",
        });

        return {
          ...state,
          focusedUser: { ...focusedUser, isFollowing: !prevIsFollowing },
        };
      });
    }
  }, 2000);

  const cleanupAfterRemovingUser = () => {
    streamContext.streamerBlockingViewer(state.focusedUser.username);
    closeBlockUserSlideUp();
    closeUserMenuSlideUp();
    removeUserFromViewers(state.focusedUser.username);
    setState(({ numViewers }) => ({ ...state, numViewers: numViewers - 1 }));
  };

  const closeChat = () => {
    closeChatOptionsSlideUp();
    closeMessagesSlideUp();
  };

  const share = async () =>
    launchShare({
      title: `Join my live stream on ${appName}!`,
      message: `Join my live stream on ${appName}!`,
      type: "toViewLiveStream",
      deepLinkArgs: { deviceId: sessionId },
    });

  const updateMessageTextInput = (commentInput: string) =>
    setState({ ...state, commentInput });

  const onCloseMessages = () =>
    setState({ ...state, hideBottomButtons: false });

  const onCloseViewAudience = () => {
    setState({
      ...state,
      loadingAudience: true,
      viewers: [],
      pageSize: 20,
      page: 1,
      reachedEnd: false,
      paginationLoading: false,
      refreshing: false,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <TouchableOpacity
        onPress={Keyboard.dismiss}
        activeOpacity={1}
        style={[{ flex: 1 }]}
      >
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            justifyContent: "space-between",
            padding: 15,
            zIndex: 2,
          }}
        >
          <StatusBar hidden />
          {/* Top Buttons */}
          <View
            style={[
              {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginLeft: orientationState.orientationIsLandscape
                  ? statusBarHeight
                  : 0,
              },
            ]}
          >
            <View>
              <DurationIndicator
                style={{ color: "rgba(255,255,255, 0.8)", alignSelf: "center" }}
                textProps={{ s: "lg" }}
              />
              <View
                style={{
                  flexDirection: "row",
                  marginTop: orientationState.orientationIsLandscape ? 0 : 10,
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Icon
                    library="ionicons"
                    name={`${Platform.OS === "ios" ? "ios" : "md"}-eye`}
                    size={18}
                    color="white"
                    style={{ marginRight: 5, height: 20 }}
                  />
                  <Icon
                    library="ionicons"
                    name={`${Platform.OS === "ios" ? "ios" : "md"}-thumbs-up`}
                    size={18}
                    color={successColor}
                    style={{ marginRight: 5, height: 20 }}
                  />
                  <Icon
                    library="ionicons"
                    name={`${Platform.OS === "ios" ? "ios" : "md"}-thumbs-down`}
                    size={18}
                    color={errorColor}
                    style={{ marginRight: 5, height: 20 }}
                  />
                </View>
                <View>
                  <View style={{ height: 20 }}>
                    <Text a="center" w="bold" s="lg">
                      {truncateThousand(streamContext.state.numViewers)}
                    </Text>
                  </View>
                  <View style={{ height: 20 }}>
                    <Text a="center" w="bold" s="lg">
                      {truncateThousand(streamContext.state.streamData.upvote)}
                    </Text>
                  </View>
                  <View style={{ height: 20 }}>
                    <Text a="center" w="bold" s="lg">
                      {truncateThousand(
                        streamContext.state.streamData.downvote
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={{ alignItems: "center" }}>
              <TouchableOpacity onPress={endCallPrompt}>
                <Icon
                  library="antdesign"
                  name="close"
                  size={30}
                  color="white"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginTop: 20 }}
                onPress={openStreamOptions}
              >
                <Icon
                  library="materialComIcons"
                  name="dots-vertical"
                  size={32}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Buttons */}
          <View
            style={[
              {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
                zIndex: 2,
              },
            ]}
          >
            {!state.hideBottomButtons && (
              <>
                <VideoIconButton
                  onPress={streamContext.toggleLocalVideo}
                  iconProps={{
                    library: "materialComIcons",
                    name: streamContext.state.isLocalVideoPaused
                      ? "video-off"
                      : "video",
                    color: "white",
                  }}
                />
                <VideoIconButton
                  onPress={streamContext.toggleAudio}
                  iconProps={{
                    name: streamContext.state.isMuted
                      ? "microphone-off"
                      : "microphone",
                    library: "materialComIcons",
                    color: "white",
                  }}
                />
                <VideoIconButton
                  iconProps={{ library: "materialComIcons", name: "sync" }}
                  onPress={streamContext.flipCamera}
                />
                <VideoIconButton
                  onPress={openMessages}
                  TopComponent={
                    <Text
                      a="center"
                      w="bold"
                      s="lg"
                      style={{ marginBottom: 5 }}
                    >
                      {truncateThousand(streamContext.state.messages.length)}
                    </Text>
                  }
                  iconProps={{
                    library: "ionicons",
                    name: `${Platform.OS === "ios" ? "ios" : "md"}-chatboxes`,
                    color: "white",
                  }}
                />
              </>
            )}
          </View>
        </View>

        {/* Video */}
        <VideoBox
          streamURL={streamContext.state.localStreamURL}
          style={{ flex: 1 }}
          objectFit={"cover"}
          type="manage-live-stream"
          paused={streamContext.state.isLocalVideoPaused}
        />
        {/* Opening Message */}
        {openingMessageVisible && (
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              top: window.height * 0.33,
            }}
          >
            <Text a="center" s="header" w="bold">
              You're live!
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <SlideUp
        ref={viewAudienceSlideUpRef}
        adjustToContentHeight={false}
        onClose={onCloseViewAudience}
        modalStyle={{ flex: 1 }}
        innerContainerStyle={{
          paddingHorizontal: 0,
          paddingBottom: 0,
          flex: 1,
        }}
        scrollViewProps={{ contentContainerStyle: { height: "100%" } }}
        modalHeight={
          orientationState.orientationIsLandscape ? 100 : window.height * 0.8
        }
      >
        <FlatList
          style={{ flex: 1, paddingHorizontal: defaultHorizontalInset }}
          data={state.viewers}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          keyExtractor={(item: any, index: number) => index.toString()}
          refreshControl={RefreshControlComponent()}
          ListEmptyComponent={ListEmptyComponent()}
          ListHeaderComponent={ListHeaderComponent()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={ListFooterComponent()}
          onEndReached={paginate}
          renderItem={({ item, index }) => (
            <ProfileItem
              {...item}
              isOnline
              activeOpacity={1}
              onPress={onPressUser}
            />
          )}
        />
      </SlideUp>

      <SlideUp
        ref={messagesRef}
        panGestureEnabled={false}
        withHandle={false}
        adjustToContentHeight={false}
        onClose={onCloseMessages}
        onOverlayPress={closeMessagesSlideUp}
        modalStyle={{ backgroundColor: "rgba(0,0,0,0.5)", flex: 1 }}
        innerContainerStyle={{
          paddingHorizontal: 0,
          paddingBottom: 0,
          flex: 1,
        }}
        scrollViewProps={{ contentContainerStyle: { height: "100%" } }}
        overlayStyle={{ backgroundColor: "transparent" }}
        modalHeight={
          orientationState.orientationIsLandscape ? 100 : window.height * 0.8
        }
        keyboardAvoidingBehavior={Platform.OS === "ios" ? "padding" : undefined}
        HeaderComponent={
          <View
            style={{
              height: 50,
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: "row",
              paddingHorizontal: 8,
            }}
          >
            <View>
              <Text s="subHeader" w="extraBold">
                Chat
              </Text>
            </View>
            <TouchableOpacity onPress={closeMessagesSlideUp}>
              <Icon library="antdesign" name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
        }
        FooterComponent={
          <ChatTextInput
            textInputProps={{
              onFocus: () => scrollToEnd(chatRef),
            }}
            RightComponent={
              <TouchableOpacity onPress={openChatOptionsSlideUp}>
                <Icon
                  library="materialComIcons"
                  name="dots-vertical"
                  size={32}
                />
              </TouchableOpacity>
            }
            transparent
            style={{ paddingBottom: 20 }}
            value={state.commentInput}
            submit={submitComment}
            maxLength={200}
            onChangeText={updateMessageTextInput}
          />
        }
      >
        <Chat
          ref={chatRef}
          messages={streamContext.state.messages}
          onPressMessage={onPressUser}
          flatListStyle={{ paddingTop: 0 }}
        />
      </SlideUp>
      <SlideUp ref={streamOptionsRef}>
        <SlideUpButton onPress={share} type="share" title="Share live stream" />
        <SlideUpButton
          onPress={openMessages}
          type="messages"
          title="Open messages"
        />
        <SlideUpButton
          onPress={viewAudience}
          type="people"
          title="See your viewers"
        />
        <SlideUpButton
          onPress={endCallPrompt}
          type="end_call"
          title="End live stream"
        />
        <SlideUpButton onPress={closeStreamOptions} type="close" />
      </SlideUp>
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
            {state.focusedUser.isFollowing !== undefined && (
              <SlideUpButton
                onPress={toggleFollow}
                type={state.focusedUser.isFollowing ? "unfollow" : "follow"}
                loading={state.followingLoading}
              />
            )}
            <SlideUpButton onPress={openBlockUserSlideUp} type="block" />
            <SlideUpButton onPress={openReportUserSlideUp} type="report" />
          </>
        )}
        <SlideUpButton
          type="help_feedback"
          title="Help or Feedback"
          onPress={() => {
            closeStreamOptions();
            openHelpFeedbackSlideUp();
          }}
        />
        <SlideUpButton onPress={closeUserMenuSlideUp} type="close" />
      </SlideUp>
      <HelpFeedbackSlideUp
        ref={helpFeedbackSlideUp}
        onCancel={closeHelpFeedbackSlideUp}
        onSubmit={closeHelpFeedbackSlideUp}
      />
      <SlideUp ref={chatOptionsRef}>
        <SlideUpButton onPress={share} type="share" title="Share live stream" />
        <SlideUpButtonBase
          onPress={closeChat}
          title="Close Chat"
          IconComponent={
            <Icon
              library="ionicons"
              name={`${Platform.OS === "ios" ? "ios" : "md"}-chatboxes`}
              size={32}
              color="white"
            />
          }
        />
        <SlideUpButton onPress={closeChatOptionsSlideUp} type="close" />
      </SlideUp>
      <BlockUserSlideUp
        ref={blockUserRef}
        username={state.focusedUser.username}
        onSubmit={closeBlockUserSlideUp}
        onSuccess={cleanupAfterRemovingUser}
        onCancel={closeBlockUserSlideUp}
        onFail={() =>
          showBanner({
            message: `A problem occurred. ${
              state.focusedUser?.username ?? "User"
            } could not be blocked.`,
          })
        }
      />
      <ReportUserSlideUp
        ref={reportUserRef}
        onSubmit={closeReportUserSlideUp}
        onSuccess={cleanupAfterRemovingUser}
        onCancel={closeReportUserSlideUp}
        onFail={() =>
          showBanner({
            message: `A problem occurred. ${
              state.focusedUser?.username ?? "User"
            } could not be reported.`,
          })
        }
        reportData={{ deviceId: sessionId }}
        type="streamer-reports-viewer"
        username={state.focusedUser.username}
      />
    </View>
  );
};

export default ManageLiveStream;
