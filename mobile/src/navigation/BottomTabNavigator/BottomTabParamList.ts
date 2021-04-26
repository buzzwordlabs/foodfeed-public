import {
  AccountStackParams,
  ConversationsStackParams,
  HomeStackParams,
  SandboxStackParams,
  CreateStackParams,
  ActivityStackParams,
} from "../Stacks";

export type BottomTabParamList = {
  ConversationsStack: undefined;
  ActivityStack: undefined;
  HomeStack: {
    screen: "Home";
    params: {
      deepLinkScreen: "ViewLiveStream" | "Profile";
      deviceId?: string;
      username?: string;
    };
  };
  CreateStack: undefined;
  AccountStack: undefined;
  SandboxStack: undefined;
};

export type BottomTabRoutes =
  | keyof ConversationsStackParams
  | keyof AccountStackParams
  | keyof HomeStackParams
  | keyof ActivityStackParams
  | keyof SandboxStackParams
  | keyof CreateStackParams;
