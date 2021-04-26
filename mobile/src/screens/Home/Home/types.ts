export type PushToProfile = (username: string) => void;
export interface PushToStreamArgs {
  deviceId: string;
  index?: number;
  removeStream: RemoveStream;
}
export interface PushToCommentsArgs {
  postId: string;
  username: string;
  avatar: string;
}
export type PushToStream = (args: PushToStreamArgs) => void;
export type RemoveStream = (removeDeviceId: string) => void | (() => {});
export type StartEdit = () => void;
export type OnFinishEditArgs = { postId: string; newDescription: string };
export type OnFinishEdit = (args: OnFinishEditArgs) => void;
export type PushToComments = (args: PushToCommentsArgs) => void;
