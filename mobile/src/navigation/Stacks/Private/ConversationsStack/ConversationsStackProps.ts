import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RemoveStream } from "../../../../screens/Home/Home/types";
import { ViewPostCommentsParams } from "../HomeStack/HomeStackProps";

export type ConversationsStackParams = {
  Conversations: {
    deepLinkScreen?: keyof ConversationsStackParams;
    conversationId?: string;
  };
  Conversation: { conversationId: string };
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
  CreateConversation: undefined;
};

export type ConversationsStackNavProps<
  T extends keyof ConversationsStackParams
> = {
  navigation: StackNavigationProp<ConversationsStackParams, T>;
  route: RouteProp<ConversationsStackParams, T>;
};
