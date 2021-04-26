import * as s from '../../zapatos/schema';

export type Session = {
  id: s.users.Selectable['id'];
};

export interface SocketJWT extends SocketIO.Socket {
  userSession: Session;
}

export interface SocketJWT extends SocketIO.Socket {
  userSession: Session;
}

export type IceConfiguration = {
  iceServers: { url: string; username?: string; credential?: string }[];
};

export type IceCandidate =
  | {
      sdpMid: string;
      sdpMLineIndex: number;
      candidate: string;
    }
  | { candidate: { completed: true } };

export type StatusCallback = (status: 'ok' | 'error', data?: any) => any;
