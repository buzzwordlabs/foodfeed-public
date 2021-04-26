import * as s from '../../zapatos/schema';

export type OfferAnswer = {
  sdp: string;
  type: string;
};

export type MakesAnswerData = {
  answer: OfferAnswer;
  remoteDeviceId: s.online_users.Selectable['deviceId'];
};

export type FirstCallStartedData = {
  offer: OfferAnswer;
};

export type CallEndedData = {
  remoteDeviceId: s.online_users.Selectable['deviceId'];
};
