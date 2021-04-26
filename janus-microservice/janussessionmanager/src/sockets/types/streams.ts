// server socket event data types

import { JanusSession, JanusPluginHandle } from 'minijanus-ts';

export type OfferAnswer = {
  sdp: string;
  type: string;
};
export type StreamNewViewer = {
  deviceId: string;
};

export type JoinStreamData = {
  deviceId: string;
};

export type LeaveStreamData = {
  deviceId: string;
};

export type StreamerMakesOfferToViewerData = {
  deviceId: string;
  offer: OfferAnswer;
};

export type ViewerMakesAnswertoStreamerOffer = {
  deviceId: string;
  answer: OfferAnswer;
};

export type StreamerBlockedViewerData = {
  username: string;
  deviceId: string;
};

export type IceCandidate =
  | {
      sdpMid: string;
      sdpMLineIndex: number;
      candidate: string;
    }
  | { candidate: { completed: true } };

export type JanusSessions = {
  isViewer: boolean;
  handle: JanusPluginHandle;
  session: JanusSession;
  janusMessageEventListenerFunc: (ev: any) => void;
};
// client socket event data types
