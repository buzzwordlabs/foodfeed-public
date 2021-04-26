import React, { useContext } from "react";
import Profile, {
  OnPushViewPost,
  OnPushJoinStream,
  OnPushProfile,
  OnPushSettings,
  OnPushFollowersList,
  OnPushFollowingList,
  OnBlockOrReportCallback,
  OnPushEditProfile,
} from "../Common/Profile/Profile";
import { AccountStackNavProps } from "../../navigation";
import { StackNavigationOptions } from "@react-navigation/stack";
import { GlobalContext } from "../../contexts";

type Props = AccountStackNavProps<"EditableProfile">;

const EditableProfile = (props: Props) => {
  const global = useContext(GlobalContext);

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

  const onPushSettings: OnPushSettings = () => {
    props.navigation.push("Settings");
  };

  const onPushEditProfile: OnPushEditProfile = () => {
    props.navigation.push("AccountSettings");
  };

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
      allowEditProfile
      username={global.state.username}
      goBack={props.navigation.goBack}
      onPushViewPost={onPushViewPost}
      onPushProfile={onPushProfile}
      onPushSettings={onPushSettings}
      onPushFollowersList={onPushFollowersList}
      onPushFollowingList={onPushFollowingList}
      onBlockOrReportCallback={onBlockOrReportCallback}
      onPushJoinStream={onPushJoinStream}
      onPushEditProfile={onPushEditProfile}
      setNavigationOptions={setNavigationOptions}
    />
  );
};

export default EditableProfile;
