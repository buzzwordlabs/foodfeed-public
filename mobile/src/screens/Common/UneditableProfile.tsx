import React from "react";
import Profile, {
  OnPushViewPost,
  OnPushJoinStream,
  OnPushProfile,
  OnPushSettings,
  OnPushFollowersList,
  OnPushFollowingList,
  OnBlockOrReportCallback,
  OnPushEditProfile,
} from "./Profile/Profile";
import { HomeStackNavProps } from "../../navigation";
import { StackNavigationOptions } from "@react-navigation/stack";

type Props = HomeStackNavProps<"UneditableProfile">;

const UneditableProfile = (props: Props) => {
  const setNavigationOptions = (options: Partial<StackNavigationOptions>) => {
    props.navigation.setOptions(options);
  };

  const onPushViewPost: OnPushViewPost = (postId, onDeletePostCallback) => {
    props.navigation.push("ViewPost", {
      postId: postId,
      onDeletePostCallback,
    });
  };
  const onPushJoinStream: OnPushJoinStream = (deviceId) => {
    props.navigation.push("ViewLiveStream", {
      deviceId,
      removeStream: () => {},
    });
  };

  const onPushProfile: OnPushProfile = (username) => {
    props.navigation.push("UneditableProfile", { username });
  };

  const onPushEditProfile: OnPushEditProfile = () => {};

  const onPushSettings: OnPushSettings = () => {};

  const onPushFollowersList: OnPushFollowersList = (username) => {
    props.navigation.push("FollowList", { username, listType: "followers" });
  };

  const onPushFollowingList: OnPushFollowingList = (username) => {
    props.navigation.push("FollowList", { username, listType: "following" });
  };

  const onBlockOrReportCallback: OnBlockOrReportCallback = (username) => {
    // TODO
  };

  return (
    <Profile
      allowEditProfile={false}
      username={props.route.params.username}
      goBack={props.navigation.goBack}
      onPushViewPost={onPushViewPost}
      onPushJoinStream={onPushJoinStream}
      onPushProfile={onPushProfile}
      onPushSettings={onPushSettings}
      onPushEditProfile={onPushEditProfile}
      onPushFollowersList={onPushFollowersList}
      onPushFollowingList={onPushFollowingList}
      onBlockOrReportCallback={onBlockOrReportCallback}
      setNavigationOptions={setNavigationOptions}
    />
  );
};

export default UneditableProfile;
