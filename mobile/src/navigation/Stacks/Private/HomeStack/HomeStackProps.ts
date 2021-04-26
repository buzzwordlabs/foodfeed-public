import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RemoveStream } from "../../../../screens/Home/Home/types";
import { ConversationsStackParams } from "../..";

export interface ViewPostCommentsParams {
  postId: string;
  username: string;
  avatar: string;
  description: string;
}

export type HomeStackParams = {
  Home: {
    deepLinkScreen?: keyof HomeStackParams | "Conversations";
    deviceId?: string;
    username?: string;
    postId?: string;
    conversationId?: string;
  };
  ViewLiveStream: {
    deviceId: string;
    removeStream: RemoveStream;
  };
  UneditableProfile: {
    username: string;
    onBlockOrReportCallback?: (...args: any[]) => any | Promise<any>;
  };
  FollowList: { username: string; listType: "followers" | "following" };
  ViewPost: {
    postId: string;
    onDeletePostCallback: (postId: string) => void;
  };
  ViewPostComments: ViewPostCommentsParams;
  // TODO: May need to change for deep linking to work
  Search: undefined;
};

export type HomeStackNavProps<T extends keyof HomeStackParams> = {
  navigation: StackNavigationProp<HomeStackParams, T>;
  route: RouteProp<HomeStackParams, T>;
};
