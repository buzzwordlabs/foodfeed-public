import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RemoveStream } from "../../../../screens/Home/Home/types";
import { ViewPostCommentsParams } from "../..";

export type AccountStackParams = {
  Settings: undefined;
  MoreAccountSettings: undefined;
  BlockList: undefined;
  Feedback: undefined;
  AppearanceSettings: undefined;
  Help: undefined;
  FAQ: undefined;
  AccountSettings: undefined;
  UneditableProfile: { username: string };
  EditableProfile: { username: string };
  FollowList: { username: string; listType: "followers" | "following" };
  ViewPost: {
    postId: string;
    onDeletePostCallback: (postId: string) => void;
  };
  ViewLiveStream: {
    deviceId: string;
    removeStream: RemoveStream;
  };
  ViewPostComments: ViewPostCommentsParams;
};

export type AccountStackNavProps<T extends keyof AccountStackParams> = {
  navigation: StackNavigationProp<AccountStackParams, T>;
  route: RouteProp<AccountStackParams, T>;
};
