import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RemoveStream } from "../../../../screens/Home/Home/types";
import { ViewPostCommentsParams } from "../..";

export type ActivityStackParams = {
  Activity: undefined;
  UneditableProfile: { username: string };
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

export type ActivityStackNavProps<T extends keyof ActivityStackParams> = {
  navigation: StackNavigationProp<ActivityStackParams, T>;
  route: RouteProp<ActivityStackParams, T>;
};
