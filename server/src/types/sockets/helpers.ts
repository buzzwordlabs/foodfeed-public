import { BooleanResponse, KeyType, Pipeline, Redis } from 'ioredis';
import * as s from '../../zapatos/schema';

export interface RedisHsetObject extends Redis {
  hset(key: KeyType, data: any): Promise<BooleanResponse>;
}

export interface RedisHsetPipelineObject extends Pipeline {
  hset(key: KeyType, data: any): Pipeline;
}

export type DeviceOrientation = 'portrait' | 'landscape';

export type UserRedisData = Pick<
  s.users.Selectable & { topics: string[] },
  'firstName' | 'lastName' | 'username' | 'avatar' | 'topics'
>;

export type DeviceRedisData = {
  upvote: s.users_streams_reactions_total.Selectable['count'];
  downvote: s.users_streams_reactions_total.Selectable['count'];
  title: s.stream_history.Selectable['title'];
  janusSession: string;
  isStreaming: s.online_users.Selectable['isStreaming'];
  streamHistory: s.stream_history.Selectable['id'];
  socketId: SocketIO.Socket['id'];
  callHistory: s.call_history.Selectable['id'];
  activeConnection: s.online_users.Selectable['activeConnection'];
  isViewing: s.online_users.Selectable['isViewing'];
  isWaiting: boolean;
  userId: s.users.Selectable['id'];
  videoPaused: boolean;
  reconnectionAttempts: number;
  deviceOrientation?: DeviceOrientation;
  callAccepted: boolean;
  inConversationRooms: boolean;
} & Pick<s.users.Selectable, 'username' | 'avatar'>;

export type StreamRedisData = Pick<
  DeviceRedisData,
  | 'username'
  | 'avatar'
  | 'upvote'
  | 'downvote'
  | 'title'
  | 'janusSession'
  | 'isStreaming'
  | 'streamHistory'
  | 'videoPaused'
  | 'deviceOrientation'
>;

export type DeviceActivityInfoRedis = Partial<
  Pick<
    DeviceRedisData,
    | 'isStreaming'
    | 'activeConnection'
    | 'isViewing'
    | 'isWaiting'
    | 'inConversationRooms'
  >
>;

export type DeviceRedisInfo = Pick<DeviceRedisData, 'socketId'> &
  Partial<Pick<DeviceRedisData, 'janusSession'>> &
  DeviceActivityInfoRedis;

export type CallRedisData = Pick<
  DeviceRedisData,
  'callHistory' | 'activeConnection'
>;

export type WaitingRedisData = Pick<DeviceRedisData, 'isWaiting'>;

export type StreamReactionData = {
  type: 'upvote' | 'downvote';
  set: boolean;
  remoteDeviceId: s.online_users.Selectable['deviceId'];
};

export type StreamMessageData = {
  message: string;
  username: s.users.Selectable['username'];
  remoteDeviceId: s.online_users.Selectable['deviceId'];
  avatar: s.users.Selectable['username'];
};
