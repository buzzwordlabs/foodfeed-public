import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { UploadedMedia } from "../../../../screens/Common/CreatePostUploadMedia/TabView/PhotoLibrary";
import { MediaSource } from "../../../../screens/Common/CreatePostUploadMedia/CreatePostUpload";

export type CreateStackParams = {
  CreateRoot: undefined;
  CreateLiveStream: { canGoBack?: boolean };
  ManageLiveStream: { streamTitle: string };
  CreatePostUploadMedia: undefined;
  CreatePostFinalize: {
    uploadedMedia: UploadedMedia[];
    mediaSource: MediaSource;
  };
  CallsRoot: undefined;
  Call: undefined;
  WaitingRoom: undefined;
};

export type CreateStackNavProps<T extends keyof CreateStackParams> = {
  navigation: StackNavigationProp<CreateStackParams, T>;
  route: RouteProp<CreateStackParams, T>;
};
