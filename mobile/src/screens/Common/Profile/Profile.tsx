import {
  BlockUserSlideUp,
  Icon,
  LoadingIndicator,
  SlideUp,
  SlideUpButton,
  Text,
  TabView,
  ReportUserSlideUp,
  UnblockUserSlideUp,
  HelpFeedbackSlideUp,
  GoBackButton,
} from "../../../components";
import {
  RefreshControl,
  TouchableOpacity,
  View,
  StyleSheet,
  ScrollView,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import {
  bottomTabBarOffset,
  appName,
  muliBold,
  muliExtraBold,
  statusBarHeight,
} from "../../../constants";
import {
  popup,
  launchShare,
  PaginationState as DefaultPaginationState,
  defaultPaginationState,
  showBanner,
  Callback,
} from "../../../utils";
import { useRequest, useSlideUp } from "../../../hooks";
import { debounce } from "lodash";

import { GlobalContext, ThemeContext } from "../../../contexts";
import StreamHistory from "./TabViews/StreamHistory";
import PostHistory from "./TabViews/PostHistory";
import CallHistory from "./TabViews/CallHistory";
import ProfileHeader from "./ProfileHeader";
import { StackNavigationOptions } from "@react-navigation/stack";
import { useScrollToTop } from "@react-navigation/native";

export interface ProfileInfo {
  firstName: string;
  lastName: string;
  avatar: string;
  bio: string;
  isFollowing: boolean;
  isFollowedBy: boolean;
  countFollowers: number;
  countFollowing: number;
  isOnline: boolean;
  isBlocked: false;
  streams: string[];
}

export interface PaginationState extends DefaultPaginationState {
  error: boolean;
  followLoading: boolean;
}

const initialPaginationState = {
  ...defaultPaginationState,
  error: false,
  followLoading: false,
};

const initialProfileInfo: ProfileInfo = {
  firstName: "",
  lastName: "",
  avatar: "",
  bio: "",
  isFollowing: false,
  isFollowedBy: false,
  countFollowers: 0,
  countFollowing: 0,
  isOnline: false,
  streams: [],
  isBlocked: false,
};

enum TabRouteTitles {
  "Posts" = "Posts",
  "Streams" = "Streams",
  "Calls" = "Calls",
}

enum TabRouteKeys {
  posts = "posts",
  streams = "streams",
  calls = "calls",
}

export type OnPushViewPost = (
  postId: string,
  onDeletePostCallback: (postId: string) => void,
  cb?: Callback
) => void;
export type OnPushProfile = (username: string, cb?: Callback) => void;
export type OnPushJoinStream = (deviceId: string, cb?: Callback) => void;
export type OnPushSettings = (cb?: Callback) => void;
export type OnPushFollowersList = (username: string, cb?: Callback) => void;
export type OnPushFollowingList = (username: string, cb?: Callback) => void;
export type OnPushEditProfile = (cb?: Callback) => void;
export type OnBlockOrReportCallback = (username: string, cb?: Callback) => void;

type Props = {
  allowEditProfile: boolean;
  username: string;
  onPushViewPost: OnPushViewPost;
  onPushProfile: OnPushProfile;
  onPushJoinStream: OnPushJoinStream;
  onPushSettings: OnPushSettings;
  onPushFollowersList: OnPushFollowersList;
  onPushFollowingList: OnPushFollowingList;
  onBlockOrReportCallback: OnBlockOrReportCallback;
  onPushEditProfile: OnPushEditProfile;
  setNavigationOptions: (options: Partial<StackNavigationOptions>) => void;
  goBack: () => void;
};

const Profile = (props: Props) => {
  const [tabIndex, setTabIndex] = React.useState(0);
  const global = useContext(GlobalContext);
  const { backgroundColor, borderColor } = useContext(ThemeContext);
  const [paginationState, setPaginationState] = useState(
    initialPaginationState
  );
  const [profileInfoState, setProfileInfoState] = useState(initialProfileInfo);
  const [request] = useRequest();
  const ref = React.useRef(null);
  useScrollToTop(ref);

  props.setNavigationOptions({
    headerShown: false,
    gestureEnabled: true,
    headerBackTitle: "Back",
  });

  const tabOptionConfig: {
    key: keyof typeof TabRouteKeys;
    title: keyof typeof TabRouteTitles;
  }[] = [
    { key: TabRouteKeys.posts, title: TabRouteTitles["Posts"] },
    { key: TabRouteKeys.streams, title: TabRouteTitles["Streams"] },
  ];
  if (props.username === global.state.username) {
    tabOptionConfig.push({
      key: TabRouteKeys.calls,
      title: TabRouteTitles["Calls"],
    });
  }
  const [routes] = React.useState(tabOptionConfig);

  const [
    userDetailsRef,
    openUserDetailsSlideUp,
    closeUserDetailsSlideUp,
  ] = useSlideUp();
  const [reportUserRef, openReportUserSlideUp, closeReportUser] = useSlideUp();
  const [
    blockUserRef,
    openBlockUserSlideUp,
    closeBlockUserSlideUp,
  ] = useSlideUp();
  const [
    unblockUserRef,
    openUnblockUserSlideUp,
    closeUnblockUserSlideUp,
  ] = useSlideUp();
  const [
    helpFeedbackSlideUp,
    openHelpFeedbackSlideUp,
    closeHelpFeedbackSlideUp,
  ] = useSlideUp();

  useEffect(() => {
    (async () => initRequest())();
  }, []);

  const initRequest = async () => {
    const response = await requestBasicProfileInfo();
    if (response.ok) {
      setPaginationState({
        ...paginationState,
        initLoading: false,
      });
      setProfileInfoState({
        ...profileInfoState,
        ...response.data,
      });
    } else {
      return setPaginationState({
        ...paginationState,
        error: true,
        initLoading: false,
      });
    }
  };

  const refresh = async () => {
    setPaginationState({ ...paginationState, refreshing: true });
    const response = await requestBasicProfileInfo();
    if (response.ok) {
      setPaginationState({
        ...paginationState,
        refreshing: false,
      });
      setProfileInfoState({
        ...profileInfoState,
        ...response.data,
      });
    } else {
      return setPaginationState({
        ...paginationState,
        error: true,
        refreshing: false,
      });
    }
  };

  const requestBasicProfileInfo = async () => {
    return request({
      url: `/user/search/profile/${props.username}`,
      method: "GET",
    });
  };

  const onPressToggleFollow = debounce(async () => {
    const handleRequest = async () => {
      setPaginationState({ ...paginationState, followLoading: true });
      const response = await request({
        url: "/user/followers",
        method: profileInfoState.isFollowing ? "DELETE" : "POST",
        body: { username: props.username },
      });
      setPaginationState({ ...paginationState, followLoading: false });
      if (response.ok) {
        setProfileInfoState(({ isFollowing, countFollowers }) => ({
          ...profileInfoState,
          isFollowing: !isFollowing,
          // @ts-ignore
          countFollowers: isFollowing ? countFollowers - 1 : countFollowers + 1,
        }));
      }
    };

    if (profileInfoState.isFollowing) {
      popup({
        title: `Unfollow ${props.username}`,
        description: `Are you sure you would like to unfollow ${props.username}?`,
        buttonOptions: [
          { text: "Cancel", onPress: () => {} },
          {
            text: "Unfollow",
            onPress: handleRequest,
            style: "destructive",
          },
        ],
      });
    } else {
      await handleRequest();
    }
  }, 500);

  const onPressCallHistoryItem = (username: string) => {
    props.onPushProfile(username);
  };

  const onSubmitReportUserSlideUp = () => {
    closeReportUser();
    closeUserDetailsSlideUp();
    props.onBlockOrReportCallback &&
      props.onBlockOrReportCallback(props.username);
    props.goBack();
  };

  const onSubmitBlockUserSlideUp = () => {
    closeBlockUserSlideUp();
    closeUserDetailsSlideUp();
    props.onBlockOrReportCallback &&
      props.onBlockOrReportCallback(props.username);
    props.goBack();
  };

  const onSubmitUnblockUserSlideUp = () => {
    closeUnblockUserSlideUp();
    closeUserDetailsSlideUp();
  };

  const onCancelUnblockUserSlideUp = () => closeBlockUserSlideUp();

  const onSuccessUnblockUserSlideUp = () => {
    setProfileInfoState({ ...profileInfoState, isBlocked: false });
  };

  const onFailUnblockUserSlideUp = () => {
    showBanner({ message: "An error occurred.", type: "danger" });
  };

  const renderScene = ({
    route,
  }: {
    route: { key: keyof typeof TabRouteKeys };
  }): React.ReactNode => {
    if (profileInfoState.isBlocked) return <></>;
    switch (route.key) {
      case "posts":
        return (
          <PostHistory
            parentRefreshing={paginationState.refreshing}
            username={props.username}
            onPressPost={props.onPushViewPost}
          />
        );
      case "streams":
        return (
          <StreamHistory
            parentRefreshing={paginationState.refreshing}
            username={props.username}
          />
        );
      case "calls":
        return (
          <CallHistory
            parentRefreshing={paginationState.refreshing}
            username={props.username}
            onPressCallHistoryItem={onPressCallHistoryItem}
          />
        );
      default:
        return <></>;
    }
  };

  const viewingOwnProfile = props.username === global.state.username;

  return (
    <View style={{ flex: 1, paddingTop: statusBarHeight, backgroundColor }}>
      {props.username && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          {!props.allowEditProfile && (
            <GoBackButton
              style={{ position: "absolute", top: 5, zIndex: 1 }}
              onPress={props.goBack}
            />
          )}
          <View style={{ flex: 1, marginBottom: 20, marginTop: 10 }}>
            <Text s="lg" w="bold" a="center">
              {props.username}
            </Text>
          </View>
          <TouchableOpacity
            style={{ position: "absolute", right: 10 }}
            onPress={openUserDetailsSlideUp}
          >
            <Icon library="materialComIcons" name="dots-horizontal" size={32} />
          </TouchableOpacity>
        </View>
      )}
      <ScrollView
        style={{ paddingBottom: bottomTabBarOffset + 20, backgroundColor }}
        refreshControl={
          <RefreshControl
            refreshing={paginationState.refreshing}
            onRefresh={refresh}
          />
        }
      >
        <View>
          {profileInfoState.firstName ? (
            <ProfileHeader
              goBack={props.goBack}
              viewingOwnProfile={viewingOwnProfile}
              allowEditProfile={props.allowEditProfile}
              onPressJoinStream={props.onPushJoinStream}
              onPressEditProfile={props.onPushEditProfile}
              onPressViewFollowersList={props.onPushFollowersList}
              onPressViewFollowingList={props.onPushFollowingList}
              onPressOpenUnblockUserSlideUp={openUnblockUserSlideUp}
              onPressToggleFollow={onPressToggleFollow}
              followLoading={paginationState.followLoading}
              isStreaming={profileInfoState.streams.length > 0}
              username={props.username}
              onPressOptions={openUserDetailsSlideUp}
              {...profileInfoState}
            />
          ) : null}
        </View>
        {paginationState.initLoading ? (
          <LoadingIndicator />
        ) : paginationState.error ? (
          <Text
            a="center"
            style={{ marginTop: 50, marginHorizontal: 20 }}
            w="bold"
          >
            An error occurred while trying to load this account. Please try
            again.
          </Text>
        ) : (
          <>
            <View
              style={{
                marginTop: 20,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderColor,
              }}
            >
              <TabView
                navigationState={{ index: tabIndex, routes }}
                renderScene={renderScene}
                onIndexChange={setTabIndex}
                lazy
              />
            </View>
          </>
        )}
        <SlideUp ref={userDetailsRef}>
          {!viewingOwnProfile ? (
            <>
              {!profileInfoState.isBlocked ? (
                <SlideUpButton onPress={openBlockUserSlideUp} type="block" />
              ) : (
                <SlideUpButton
                  onPress={openUnblockUserSlideUp}
                  type="unblock"
                />
              )}
              <SlideUpButton onPress={openReportUserSlideUp} type="report" />
            </>
          ) : (
            props.allowEditProfile && (
              <SlideUpButton
                onPress={() => {
                  closeUserDetailsSlideUp();
                  props.onPushSettings();
                }}
                type="settings"
                title="Account Settings"
              />
            )
          )}
          <SlideUpButton
            type="share"
            title="Share"
            onPress={async () => {
              await launchShare({
                type: "toViewProfile",
                title: `${props.username}'s Profile`,
                message: `Check out ${
                  viewingOwnProfile ? "my" : `${props.username}'s`
                } profile on ${appName}!`,
                deepLinkArgs: { username: props.username },
              });
              closeUserDetailsSlideUp();
            }}
          />
          <SlideUpButton
            type="help_feedback"
            title="Help or Feedback"
            onPress={() => {
              closeUserDetailsSlideUp();
              openHelpFeedbackSlideUp();
            }}
          />
          <SlideUpButton onPress={closeUserDetailsSlideUp} type="close" />
        </SlideUp>
        <HelpFeedbackSlideUp
          ref={helpFeedbackSlideUp}
          onCancel={closeHelpFeedbackSlideUp}
          onSubmit={closeHelpFeedbackSlideUp}
        />
        {!viewingOwnProfile && (
          <>
            <ReportUserSlideUp
              ref={reportUserRef}
              onSubmit={onSubmitReportUserSlideUp}
              onCancel={closeReportUser}
              reportData={{ username: props.username }}
              type="user"
              username={props.username}
            />
            <BlockUserSlideUp
              ref={blockUserRef}
              onSubmit={onSubmitBlockUserSlideUp}
              onCancel={closeBlockUserSlideUp}
              username={props.username}
            />
            <UnblockUserSlideUp
              ref={unblockUserRef}
              onSubmit={onSubmitUnblockUserSlideUp}
              onCancel={onCancelUnblockUserSlideUp}
              onSuccess={onSuccessUnblockUserSlideUp}
              onFail={onFailUnblockUserSlideUp}
              username={props.username}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Profile;
