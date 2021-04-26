import {
  MediaStream,
  RTCIceCandidate,
  RTCIceCandidateType,
  RTCPeerConnection,
  RTCPeerConnectionConfiguration,
  RTCSessionDescription,
  RTCSessionDescriptionType,
  mediaDevices,
} from "react-native-webrtc";
import React, { Component } from "react";
import {
  showBanner,
  bugsnagBreadcrumb,
  AMPLITUDE_TRANSACTIONAL_EVENTS,
  amplitudeTrack,
} from "../utils";

import InCallManager from "react-native-incall-manager";
import { SocketContext } from "./SocketContext";
import { CallEventListenersEnum } from "./events";

type ContextProps = {
  state: State;
  resetState: () => void;
  setState: (newState: Partial<State>, callback?: () => void) => void;
  callAccepted: () => void;
  localEndCall: () => void;
  toggleAudio: () => void;
  toggleLocalVideo: () => void;
  flipCamera: () => void;
  joinedWaitingRoom: () => void;
  leaveWaitingRoom: () => void;
  setupRoom: () => boolean;
  noUsersFoundForCall: () => void;
  remoteEndCall: () => void;
  unknownCallError: () => void;
  muteAudio: () => void;
  unmuteAudio: () => void;
  callRejected: () => void;
  enableLocalVideo: () => void;
  disableLocalVideo: () => void;
  appInBackground: () => void;
  appReturnedToForeground: () => void;
  cleanup: () => void;
  numberOnlineUsersInWaitingRoom: (data: { number: number }) => void;
  resetFeedbackState: () => void;
  findUsersToCall: () => void;
  waitingCleanup: () => void;
  rejoinWaitingRoom: () => void;
  getState: () => State;
  callPresent: boolean;
  getCallPresent: () => boolean;
};

type SourceInformation = any;

const CallContext = React.createContext<ContextProps>(
  (null as unknown) as ContextProps
);

type LocalPotentialCallStatus =
  | "searching_for_match"
  | "local_deciding"
  | "waiting_for_remote";

type RemotePotentialCallStatus =
  | "unknown"
  | "remote_accepted_call"
  | "remote_denied_call";

interface State {
  localStreamURL: string;
  remoteStreamURL: string;
  remoteDeviceId: string;
  remoteUserInfo: {
    username: string;
    avatar: string;
    isFollowing: boolean;
    isFollower: boolean;
  };
  remoteVideoPaused: boolean;
  callId: string;
  callDuration: number;
  isMuted: boolean;
  numOnlineUsers: number;
  showCallFeedbackSlideUp: boolean;
  isLocalVideoPaused: boolean;
  localPotentialCallStatus: LocalPotentialCallStatus;
  remotePotentialCallStatus: RemotePotentialCallStatus;
}

const initialState: State = {
  localStreamURL: "",
  remoteStreamURL: "",
  remoteDeviceId: "",
  remoteUserInfo: {
    username: "",
    avatar: "",
    isFollowing: false,
    isFollower: false,
  },
  remoteVideoPaused: false,
  callId: "",
  callDuration: 0,
  isMuted: false,
  numOnlineUsers: 0,
  showCallFeedbackSlideUp: false,
  isLocalVideoPaused: false,
  localPotentialCallStatus: "searching_for_match",
  remotePotentialCallStatus: "unknown",
};

type PotentialMatchInfo = {
  remoteDeviceId: string;
  remoteUserInfo: {
    username: string;
    avatar: string;
    isFollowing: boolean;
    isFollower: boolean;
  };
};

enum EmitEventsEnum {
  "get_ice_configuration" = "get_ice_configuration",
  "joined_waiting_room" = "joined_waiting_room",
  "leave_waiting_room" = "leave_waiting_room",
  "call_on_ice_candidate" = "call_on_ice_candidate",
  "find_users_to_call" = "find_users_to_call",
  "caller_makes_offer_to_callee" = "caller_makes_offer_to_callee",
  "callee_makes_answer_to_caller" = "callee_makes_answer_to_caller",
  "call_ended" = "call_ended",
  "call_rejected" = "call_rejected",
  "rejoin_waiting_room" = "rejoin_waiting_room",
  "call_accepted" = "call_accepted",
}

type EmitEvents = keyof typeof EmitEventsEnum;

type Props = {};

class CallContextProvider extends Component<Props, State> {
  static contextType = SocketContext;
  context!: React.ContextType<typeof SocketContext>;
  callDurationTimer: any;
  peerConnection: RTCPeerConnection = (null as unknown) as RTCPeerConnection;
  localStream: MediaStream = (null as unknown) as MediaStream;
  iceCandidates: RTCIceCandidateType[] = [];
  callPresent = false;
  clearDurationTimer = () => clearInterval(this.callDurationTimer);
  state = initialState;
  localCallRejected = false;
  videoPausedDataChannel = (null as unknown) as any;
  errorRetries: { [key in EmitEvents]: number } = {
    get_ice_configuration: 0,
    joined_waiting_room: 0,
    leave_waiting_room: 0,
    call_on_ice_candidate: 0,
    find_users_to_call: 0,
    caller_makes_offer_to_callee: 0,
    callee_makes_answer_to_caller: 0,
    call_ended: 0,
    call_rejected: 0,
    rejoin_waiting_room: 0,
    call_accepted: 0,
  };

  setupRoom = () => {
    this.initCallSocketEvents();
    return true;
  };

  resetState = () => this.setState(initialState);

  leaveWaitingRoom = () => {
    this.turnOffCallSocketEvents();
    this.resetCallState();
  };

  resetCallState = () => {
    const { numOnlineUsers, callId, showCallFeedbackSlideUp } = this.state;
    this.setState({
      ...initialState,
      numOnlineUsers,
      callId,
      showCallFeedbackSlideUp,
    });
  };
  resetFeedbackState = () => {
    this.setState({ showCallFeedbackSlideUp: false });
  };

  updateState = (newState: Partial<State>, callback?: () => void) =>
    this.setState(newState as State, callback);

  componentWillUnmount = () => this.clearDurationTimer();

  socketEmitStatusCb = (
    event: EmitEvents,
    successCb: (dataCb?: any) => any
  ) => (status: "ok" | "error", data?: any) => {
    if (status === "error") {
      amplitudeTrack(AMPLITUDE_TRANSACTIONAL_EVENTS.call_error, {
        event,
        description: "server_error",
      });
      this.errorHandler({ type: event });
    }
    if (status === "ok") {
      successCb(data);
    }
  };

  emit = (event: EmitEvents, ...args: any[]) => {
    this.context.socket.emit(event, ...args);
  };

  getRTCConfiguration = async (): Promise<RTCPeerConnectionConfiguration> => {
    return new Promise((resolve, reject) => {
      this.emit(
        "get_ice_configuration",
        this.socketEmitStatusCb("get_ice_configuration", (data) => {
          resolve(data);
        })
      );
    });
  };

  setupPeerConnection = async () => {
    const configuration = await this.getRTCConfiguration();
    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onaddstream = (event: any) => {
      this.setState({ remoteStreamURL: event.stream.toURL() });
    };

    this.videoPausedDataChannel = peerConnection.createDataChannel(
      "remote_video_paused"
    );

    this.videoPausedDataChannel.onopen = (event: any) => {
      this.videoPausedDataChannel.send(`${this.state.isLocalVideoPaused}`);
    };

    this.videoPausedDataChannel.onmessage = (event: any) => {
      if (event.data === "true") {
        this.setState({ remoteVideoPaused: true });
      } else if (event.data === "false") {
        this.setState({ remoteVideoPaused: false });
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event?.candidate) {
        this.emit(
          "call_on_ice_candidate",
          {
            candidate: event.candidate,
            remoteDeviceId: this.state.remoteDeviceId,
          },
          this.socketEmitStatusCb("call_on_ice_candidate", () => {})
        );
      }
    };

    return peerConnection;
  };

  initCallSocketEvents = () => {
    const {
      startCall,
      callerReceivesCalleeAnswer,
      oneToOneCallId,
      noUsersFoundForCall,
      onIceCandidateReceived,
      numberOnlineUsersInWaitingRoom,
      calleeReceivesCallerOffer,
      remoteCallRejected,
      potentialMatch,
    } = this;
    if (!this.context.socket) return;

    this.context.turnOnCallListener(
      CallEventListenersEnum.initiate_call,
      startCall
    );

    this.context.turnOnCallListener(
      CallEventListenersEnum.caller_receives_callee_answer,
      callerReceivesCalleeAnswer
    );
    this.context.turnOnCallListener(
      CallEventListenersEnum.call_on_ice_candidate_received,
      onIceCandidateReceived
    );

    this.context.turnOnCallListener(
      CallEventListenersEnum.one_to_one_call_id,
      oneToOneCallId
    );
    this.context.turnOnCallListener(
      CallEventListenersEnum.no_users_found_for_call,
      noUsersFoundForCall
    );

    this.context.state.socket.on(
      "number_online_users_in_waiting_room",
      numberOnlineUsersInWaitingRoom
    );

    this.context.turnOnCallListener(
      CallEventListenersEnum.remote_potential_match,
      potentialMatch
    );

    this.context.turnOnCallListener(
      CallEventListenersEnum.callee_receives_caller_offer,
      calleeReceivesCallerOffer
    );

    this.context.turnOnCallListener(
      CallEventListenersEnum.remote_call_rejected,
      remoteCallRejected
    );
  };

  turnOffCallSocketEvents = () => {
    const {
      startCall,
      callerReceivesCalleeAnswer,
      oneToOneCallId,
      noUsersFoundForCall,
      onIceCandidateReceived,
      numberOnlineUsersInWaitingRoom,
      calleeReceivesCallerOffer,
      remoteCallRejected,
      potentialMatch,
      leftWaitingRoom,
    } = this;
    if (!this.context.socket) return;

    this.context.state.socket.off(
      "number_online_users_in_waiting_room",
      numberOnlineUsersInWaitingRoom
    );

    leftWaitingRoom();

    this.context.turnOffCallListener(
      CallEventListenersEnum.initiate_call,
      startCall
    );

    this.context.turnOffCallListener(
      CallEventListenersEnum.caller_receives_callee_answer,
      callerReceivesCalleeAnswer
    );
    this.context.turnOffCallListener(
      CallEventListenersEnum.call_on_ice_candidate_received,
      onIceCandidateReceived
    );

    this.context.turnOffCallListener(
      CallEventListenersEnum.one_to_one_call_id,
      oneToOneCallId
    );
    this.context.turnOffCallListener(
      CallEventListenersEnum.no_users_found_for_call,
      noUsersFoundForCall
    );

    this.context.turnOffCallListener(
      CallEventListenersEnum.remote_potential_match,
      potentialMatch
    );

    this.context.turnOffCallListener(
      CallEventListenersEnum.callee_receives_caller_offer,
      calleeReceivesCallerOffer
    );
    this.context.turnOffCallListener(
      CallEventListenersEnum.remote_call_rejected,
      remoteCallRejected
    );
  };

  joinedWaitingRoom = () => {
    this.emit(
      "joined_waiting_room",
      this.socketEmitStatusCb("joined_waiting_room", () => {})
    );
  };

  leftWaitingRoom = () => {
    this.emit(
      "leave_waiting_room",
      this.socketEmitStatusCb("leave_waiting_room", () => {})
    );
  };

  unknownCallError = () => {
    bugsnagBreadcrumb(CallEventListenersEnum.call_unknown_error, {
      remoteUserInfo: this.state.remoteUserInfo,
    });
    this.remoteEndCall();
  };

  numberOnlineUsersInWaitingRoom = (data: { number: number }) => {
    this.setState({ numOnlineUsers: data.number });
  };

  noUsersFoundForCall = () => {
    // TODO do something?
  };

  onIceCandidateReceived = (data: { candidate: RTCIceCandidateType }) => {
    if (this.peerConnection) {
      this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } else {
      this.iceCandidates.push(data.candidate);
    }
  };

  oneToOneCallId = (data: { callId: string }) => {
    this.setState({ callId: data.callId });
  };

  getState = () => this.state;

  // used locally and as a sockett event
  potentialMatch = (data: PotentialMatchInfo) => {
    this.setState({
      remoteDeviceId: data.remoteDeviceId,
      remoteUserInfo: data.remoteUserInfo,
      localPotentialCallStatus: "local_deciding",
    });
  };

  calleeReceivesCallerOffer = async (data: {
    offer: RTCSessionDescriptionType;
  }) => {
    this.peerConnection = await this.setupPeerConnection();
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );
    this.localStream = await this.createStream({ isFront: true });
    this.peerConnection.addStream(this.localStream);

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.emit(
      "callee_makes_answer_to_caller",
      {
        answer,
        remoteDeviceId: this.state.remoteDeviceId,
      },
      this.socketEmitStatusCb("callee_makes_answer_to_caller", () => {})
    );
    this.iceCandidates.map((candidate) =>
      this.peerConnection.addIceCandidate(candidate)
    );
    this.iceCandidates = [];
    InCallManager.start({ media: "video" });
    this.startCallDurationTimer();
    this.setState({
      localStreamURL: this.localStream.toURL(),
      remotePotentialCallStatus: "remote_accepted_call",
    });
    this.callPresent = true;
  };

  callerReceivesCalleeAnswer = async (data: any) => {
    const { answer } = data;

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
    );

    this.setState({
      remotePotentialCallStatus: "remote_accepted_call",
      localStreamURL: this.localStream.toURL(),
    });
    this.callPresent = true;
    InCallManager.start({ media: "video" });
    this.startCallDurationTimer();
  };

  startCallDurationTimer = () => {
    const { callDurationTimer, clearDurationTimer } = this;
    this.setState({ callDuration: 0 });
    if (callDurationTimer) clearDurationTimer();
    this.callDurationTimer = setInterval(() => {
      this.setState(({ callDuration }) => ({
        callDuration: callDuration + 1000,
      }));
    }, 1000);
  };

  getMediaDevicesInformation = async (): Promise<SourceInformation[]> => {
    return mediaDevices.enumerateDevices();
  };

  createStream = async ({
    isFront,
  }: {
    isFront: boolean;
  }): Promise<MediaStream> => {
    const mediaDevicesInformation = await this.getMediaDevicesInformation();
    const videoSourceId: null | SourceInformation = mediaDevicesInformation.filter(
      (source: any) =>
        source.kind == "videoinput" &&
        source.facing == (isFront ? "front" : "environment")
    );
    return (mediaDevices.getUserMedia({
      audio: true,
      video: {
        mandatory: {
          minWidth: 1280,
          minHeight: 720,
          minFrameRate: 30,
        },
        facingMode: isFront ? "user" : "environment",
        optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
      },
    }) as unknown) as MediaStream;
  };

  findUsersToCall = () => {
    this.emit(
      "find_users_to_call",
      this.socketEmitStatusCb(
        "find_users_to_call",
        (data?: PotentialMatchInfo) => {
          if (data) {
            this.localCallRejected = false;
            this.potentialMatch(data);
          }
        }
      )
    );
  };

  // sockt event
  startCall = async () => {
    this.peerConnection = await this.setupPeerConnection();
    this.localStream = await this.createStream({ isFront: true });
    this.peerConnection.addStream(this.localStream);
    const desc = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(desc);
    this.emit(
      "caller_makes_offer_to_callee",
      {
        remoteDeviceId: this.state.remoteDeviceId,
        offer: desc,
      },
      this.socketEmitStatusCb("caller_makes_offer_to_callee", () => {})
    );
  };

  getCallPresent = () => this.callPresent;

  remoteEndCall = () => {
    this.callPresent = false;
    showBanner({
      message: "Your call has ended.",
      description:
        'If this call failed, please let us know under "Feedback" in your account settings screen.',
    });
    this.stopCall();
  };

  localEndCall = () => {
    if (this.callPresent) {
      this.callPresent = false;
      this.emit(
        "call_ended",
        { remoteDeviceId: this.state.remoteDeviceId },
        this.socketEmitStatusCb("call_ended", () => {})
      );
      return this.stopCall();
    }
  };

  stopCall = () => {
    const { callDuration } = this.state;
    this.setState({
      showCallFeedbackSlideUp: callDuration / 1000 > 60, // Only if call lasted at least 1 minute
    });
    this.cleanup();
  };

  remoteCallRejected = () => {
    if (!this.localCallRejected) {
      this.setState({ remotePotentialCallStatus: "remote_denied_call" });
    } else {
      this.localCallRejected = false;
    }
  };

  rejoinWaitingRoom = () => {
    this.emit(
      "rejoin_waiting_room",
      this.socketEmitStatusCb("rejoin_waiting_room", () => {})
    );
  };

  callAccepted = () => {
    this.emit(
      "call_accepted",
      { remoteDeviceId: this.state.remoteDeviceId },
      this.socketEmitStatusCb("call_accepted", () => {})
    );
  };

  callRejected = () => {
    this.localCallRejected = true;
    this.emit(
      "call_rejected",
      { remoteDeviceId: this.state.remoteDeviceId },
      this.socketEmitStatusCb("call_rejected", () => {})
    );
    this.waitingCleanup();
  };

  peerConnectionAndSystemCleanup = () => {
    if (this.localStream) {
      if (this.state.isMuted) this.unmuteAudio();
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream.release();
    }
    InCallManager.stop();
    this.clearDurationTimer();
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.peerConnection = (null as unknown) as RTCPeerConnection;
    this.localStream = (null as unknown) as MediaStream;
  };

  waitingCleanup = () => {
    this.peerConnectionAndSystemCleanup();
    this.setState({
      remotePotentialCallStatus: initialState.remotePotentialCallStatus,
      localPotentialCallStatus: initialState.localPotentialCallStatus,
    });
  };

  cleanup = () => {
    this.peerConnectionAndSystemCleanup();
    this.resetCallState();
  };

  toggleAudio = () =>
    this.state.isMuted ? this.unmuteAudio() : this.muteAudio();

  muteAudio = () => {
    this.localStream.getTracks().forEach((t) => {
      if (t.kind === "audio") t.enabled = false;
    });
    this.setState({ isMuted: true });
  };

  unmuteAudio = () => {
    this.localStream.getTracks().forEach((t) => {
      if (t.kind === "audio") t.enabled = true;
    });
    this.setState({ isMuted: false });
  };

  toggleLocalVideo = () =>
    this.state.isLocalVideoPaused
      ? this.enableLocalVideo()
      : this.disableLocalVideo();

  enableLocalVideo = () => {
    this.localStream.getTracks().forEach((track) => {
      if (track.kind === "video") {
        track.enabled = true;
      }
    });
    this.videoPausedDataChannel.send("false");
    this.setState({ isLocalVideoPaused: false });
  };

  disableLocalVideo = () => {
    this.localStream.getTracks().forEach((track) => {
      if (track.kind === "video") {
        track.enabled = false;
      }
    });
    this.videoPausedDataChannel.send("true");
    this.setState({ isLocalVideoPaused: true });
  };

  appInBackground = () => {
    this.muteAudio();
    this.disableLocalVideo();
  };

  appReturnedToForeground = () => {
    this.unmuteAudio();
    this.enableLocalVideo();
  };

  flipCamera = () => {
    if (!this.localStream) return;
    const videoTrack = this.localStream.getVideoTracks()[0];
    this.setState({ localStreamURL: "" }, () => {
      videoTrack._switchCamera();
      this.setState({ localStreamURL: this.localStream.toURL() });
    });
  };

  isCameraFacingUser = () => {
    if (!this.localStream) return;
    const videoTrack = this.localStream.getVideoTracks()[0];
    videoTrack.getSettings();
  };

  assertUnreachable = (x: never): never => {
    throw new Error(
      "This case shouldn't be allowed in CallContext. Your error handler isn't account for all cases."
    );
  };

  errorHandler = (data: { type: EmitEvents }) => {
    if (this.errorRetries[data.type] >= 3) {
      this.errorRetries[data.type] = 0;
      return;
    }
    if (this.errorRetries[data.type] === undefined)
      this.errorRetries[data.type] = 0;
    else this.errorRetries[data.type] = this.errorRetries[data.type] + 1;

    switch (data.type) {
      case "joined_waiting_room": {
        this.emit(
          "joined_waiting_room",
          this.socketEmitStatusCb("joined_waiting_room", () => {})
        );
        break;
      }
      case "leave_waiting_room": {
        this.emit(
          "leave_waiting_room",
          this.socketEmitStatusCb("leave_waiting_room", () => {})
        );
        break;
      }

      case "find_users_to_call": {
        this.stopCall();
        this.startCall();
        break;
      }

      case "get_ice_configuration":
      case "call_ended": {
        break;
      }

      case "caller_makes_offer_to_callee":
      case "callee_makes_answer_to_caller":
      case "call_on_ice_candidate": {
        this.stopCall();
        showBanner({
          message: "Oops! Something went wrong. Please go back and try again.",
        });
        break;
      }

      case "rejoin_waiting_room":
      case "call_accepted":
      case "call_rejected": {
        break;
      }

      default: {
        this.assertUnreachable(data.type);
      }
    }
  };

  render() {
    return (
      <CallContext.Provider
        value={{
          state: this.state,
          resetState: this.resetState,
          setState: this.updateState,
          callAccepted: this.callAccepted,
          localEndCall: this.localEndCall,
          toggleAudio: this.toggleAudio,
          toggleLocalVideo: this.toggleLocalVideo,
          flipCamera: this.flipCamera,
          leaveWaitingRoom: this.leaveWaitingRoom,
          setupRoom: this.setupRoom,
          joinedWaitingRoom: this.joinedWaitingRoom,
          callRejected: this.callRejected,
          remoteEndCall: this.remoteEndCall,
          unknownCallError: this.unknownCallError,
          noUsersFoundForCall: this.noUsersFoundForCall,
          muteAudio: this.muteAudio,
          unmuteAudio: this.unmuteAudio,
          enableLocalVideo: this.enableLocalVideo,
          disableLocalVideo: this.disableLocalVideo,
          appInBackground: this.appInBackground,
          appReturnedToForeground: this.appReturnedToForeground,
          cleanup: this.cleanup,
          numberOnlineUsersInWaitingRoom: this.numberOnlineUsersInWaitingRoom,
          resetFeedbackState: this.resetFeedbackState,
          findUsersToCall: this.findUsersToCall,
          rejoinWaitingRoom: this.rejoinWaitingRoom,
          waitingCleanup: this.waitingCleanup,
          getState: this.getState,
          callPresent: this.callPresent,
          getCallPresent: this.getCallPresent,
        }}
      >
        {this.props.children}
      </CallContext.Provider>
    );
  }
}

export { CallContext, CallContextProvider };
