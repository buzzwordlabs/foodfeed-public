// server socket event data interfaces

import { OfferAnswer } from '.';
import * as s from '../../zapatos/schema';

export type JoinStreamData = {
  remoteDeviceId: s.online_users.Selectable['deviceId'];
  userInfo: Partial<s.users.Selectable>;
};

export type LeaveStreamData = {
  remoteDeviceId: s.online_users.Selectable['deviceId'];
  streamEnded?: boolean;
};

export type StreamerMakesOfferToViewerData = {
  remoteDeviceId: s.online_users.Selectable['deviceId'];
  offer: OfferAnswer;
};

export type ViewerMakesAnswertoStreamerOffer = {
  remoteDeviceId: s.online_users.Selectable['deviceId'];
  answer: OfferAnswer;
};

export type StreamerBlockedViewerData = {
  username: s.users.Selectable['username'];
};
