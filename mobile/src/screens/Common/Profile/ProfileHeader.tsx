import React, { useContext } from "react";
import {
  ProfileInfo,
  OnPushJoinStream,
  OnPushEditProfile,
  OnPushFollowersList,
  OnPushFollowingList,
} from "./Profile";
import {
  Text,
  Avatar,
  Divider,
  Button,
  Icon,
  GoBackButton,
} from "../../../components";
import { TouchableOpacity, View } from "react-native";
import {
  tintColor,
  successColor,
  errorColor,
  statusBarHeight,
} from "../../../constants";
import * as Animatable from "react-native-animatable";
import { ThemeContext } from "../../../contexts";

interface Props extends ProfileInfo {
  goBack: () => void;
  allowEditProfile: boolean;
  viewingOwnProfile: boolean;
  onPressJoinStream: OnPushJoinStream;
  onPressEditProfile: OnPushEditProfile;
  onPressViewFollowersList: OnPushFollowersList;
  onPressViewFollowingList: OnPushFollowingList;
  onPressToggleFollow: () => void;
  onPressOpenUnblockUserSlideUp: () => void;
  onPressOptions: () => void;
  followLoading: boolean;
  isStreaming: boolean;
  username: string;
}

const ProfileHeader = (props: Props) => {
  const { backgroundColor, liftedBackgroundColor } = useContext(ThemeContext);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ alignItems: "center" }}>
        <View>
          <TouchableOpacity
            style={{
              padding: 3,
              borderRadius: 100,
              borderWidth: props.isStreaming ? 2 : 0,
              borderColor: tintColor,
            }}
            onPress={() =>
              props.isStreaming
                ? props.onPressJoinStream(props.streams[0])
                : props.allowEditProfile
                ? props.onPressEditProfile()
                : () => {}
            }
            activeOpacity={props.isStreaming ? 1 : 0.5}
          >
            <Avatar style={{ width: 100, height: 100 }} avatar={props.avatar} />
          </TouchableOpacity>
          <View
            style={{
              width: 17.5,
              height: 17.5,
              borderRadius: 20,
              backgroundColor:
                props.viewingOwnProfile || props.isOnline
                  ? successColor
                  : "gray",
              position: "absolute",
              borderColor: backgroundColor,
              borderWidth: 3,
              padding: 7,
              top: 5,
              right: 10,
            }}
          />
        </View>
        <Text style={{ marginTop: 20 }} a="center" w="semiBold" s="xl">
          {props.firstName} {props.lastName}
        </Text>
        {props.isStreaming && !props.isBlocked ? (
          <Text a="center" w="bold" t="highlight">
            is streaming!
          </Text>
        ) : null}
        <View style={{ marginTop: 20, flexDirection: "row" }}>
          <TouchableOpacity
            style={{ paddingHorizontal: 10 }}
            onPress={() => props.onPressViewFollowersList(props.username)}
          >
            <Text a="center" w="bold">
              {props.countFollowers}
            </Text>
            <Text a="center">Followers</Text>
          </TouchableOpacity>
          <Divider direction="vertical" />
          <TouchableOpacity
            style={{ paddingHorizontal: 10 }}
            onPress={() => props.onPressViewFollowingList(props.username)}
          >
            <Text a="center" w="bold">
              {props.countFollowing}
            </Text>
            <Text a="center">Following</Text>
          </TouchableOpacity>
        </View>
        {props.bio ? (
          <View style={{ marginHorizontal: 20, marginTop: 20 }}>
            <Text>{props.bio}</Text>
          </View>
        ) : null}
        {props.isFollowedBy && !props.isBlocked ? (
          <Text a="center" style={{ marginTop: 20 }}>
            <Text w="bold">{props.username}</Text> is following you
          </Text>
        ) : null}
        <View style={{ flexDirection: "row" }}>
          {!props.viewingOwnProfile && !props.isBlocked ? (
            <Button
              loading={props.followLoading}
              title={props.isFollowing ? "Unfollow" : "Follow"}
              onPress={props.onPressToggleFollow}
              style={[
                {
                  height: 36,
                  width: 150,
                  marginTop: 20,
                  marginHorizontal: 10,
                },
                props.isFollowing ? { backgroundColor: errorColor } : {},
              ]}
              textStyle={{ fontSize: 14 }}
            />
          ) : null}
          {props.isBlocked ? (
            <Button
              title="Unblock"
              style={{
                height: 36,
                width: 150,
                marginTop: 20,
                marginHorizontal: 10,
              }}
              onPress={props.onPressOpenUnblockUserSlideUp}
            />
          ) : null}
          {props.isStreaming && !props.isBlocked ? (
            <Animatable.View
              animation="pulse"
              easing="ease-out"
              iterationCount={3}
            >
              <Button
                textStyle={{ fontSize: 16 }}
                style={{
                  height: 36,
                  width: 150,
                  marginTop: 20,
                  marginHorizontal: 10,
                }}
                title="Join Stream"
                onPress={() => props.onPressJoinStream(props.streams[0])}
              />
            </Animatable.View>
          ) : null}
        </View>
        {props.viewingOwnProfile && props.allowEditProfile ? (
          <Button
            textStyle={{ fontSize: 16 }}
            style={{
              height: 36,
              width: 150,
              marginTop: 20,
              marginHorizontal: 10,
              backgroundColor: liftedBackgroundColor,
            }}
            title="Edit Profile"
            onPress={props.onPressEditProfile}
          />
        ) : null}
      </View>
    </View>
  );
};

export default ProfileHeader;
