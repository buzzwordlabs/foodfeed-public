import {
  MediaStream,
  RTCPeerConnection,
  RTCPeerConnectionConfiguration,
  RTCSessionDescription,
  RTCSessionDescriptionType,
  mediaDevices,
} from "react-native-webrtc";
import React, { Component } from "react";
import {
  readCacheMulti,
  sessionId,
  showBanner,
  amplitudeTrack,
  AMPLITUDE_TRANSACTIONAL_EVENTS,
  cleanIncomingText,
  User,
} from "../utils";

import InCallManager from "react-native-incall-manager";
import { SocketContext } from "./SocketContext";
import dayjs from "dayjs";
import { StreamEventListenersEnum } from "./events";

type ContextProps = {
  state: State;
  resetState: () => void;
  initStreamSocketEvents: () => void;
  startStream: (
    streamTitle: string,
    orientationIsLandscape: boolean
  ) => Promise<void>;
  endStream: () => void;
  streamComplete: () => void;
  toggleLocalVideo: () => void;
  joinStream: (remoteDeviceId: string) => Promise<void>;
  streamReaction: (data: ReactionEvent) => void;
  streamMessage: (data: MessageEvent) => void;
  leaveStream: () => void;
  flipCamera: () => void;
  toggleAudio: () => void;
  streamerBlockingViewer: (username: string) => void;
  streamNotAvailable: () => void;
  cleanup: () => void;
  muteAudio: () => void;
  unmuteAudio: () => void;
  enableLocalVideo: () => void;
  disableLocalVideo: () => void;
  appInBackground: () => void;
  appReturnedToForeground: () => void;
  videoStreamRestartedStreamer: () => Promise<void>;
  orientationChanged: (deviceIsLandscape: boolean) => void;
};

type SourceInformation = any;

const StreamContext = React.createContext<ContextProps>(
  (null as unknown) as ContextProps
);

export type StreamData = {
  remoteDeviceId: string;
  isFollowing: boolean;
  upvote: number;
  downvote: number;
  title: string;
  username: string;
  avatar: string;
  videoPaused: boolean;
  deviceOrientation: DeviceOrientation;
};
export type DeviceOrientation = "portrait" | "landscape";

export type StreamEventReceived = MessageEventReceived | ReactionEvent;
export type StreamEventMetadataEnums = "upvote" | "downvote";
export interface Message extends User {
  message: string;
  time: string;
  deviceId: string;
}

export interface MessageEvent extends User {
  message: string;
}

export interface MessageEventReceived extends User, MessageEvent {
  deviceId: string;
}

export interface ReactionEvent {
  type: StreamEventMetadataEnums;
  set: boolean;
  value?: number;
}

type Streams = {
  deviceId: string;
  streamTitle: string;
  avatar: string;
  username: string;
  thumbnail: string;
  upvote: string;
  downvote: string;
  deviceOrientation: DeviceOrientation;
};

interface State {
  isStreaming: boolean;
  streams: Streams[];
  numViewers: number;
  blockedUsers: { [index: string]: boolean };
  streamData: StreamData;
  remoteStreamURL: string;
  viewerUserInfo: User;
  messages: Message[];
  localStreamURL: string;
  isMuted: boolean;
  isLocalVideoPaused: boolean;
  reactionToggled: {
    downvote: boolean;
    upvote: boolean;
  };
}

const initialState: State = {
  localStreamURL: "",
  streams: [],
  isMuted: false,
  numViewers: 0,
  blockedUsers: {},
  isStreaming: false,
  isLocalVideoPaused: false,
  reactionToggled: {
    downvote: false,
    upvote: false,
  },
  streamData: {
    remoteDeviceId: "",
    upvote: 0,
    downvote: 0,
    title: "",
    username: "",
    avatar: "",
    isFollowing: false,
    deviceOrientation: "portrait",
    videoPaused: false,
  },
  remoteStreamURL: "",
  viewerUserInfo: {
    username: "",
    avatar: "",
  },
  messages: [],
};

enum EmitEventsEnum {
  "start_stream" = "start_stream",
  "stream_ended" = "stream_ended",
  "leave_stream" = "leave_stream",
  "viewer_answered_stream" = "viewer_answered_stream",
  "streamer_block_viewer" = "streamer_block_viewer",
  "get_ice_configuration" = "get_ice_configuration",
  "join_stream" = "join_stream",
  "streamer_ice_candidate" = "streamer_ice_candidate",
  "viewer_ice_candidate" = "viewer_ice_candidate",
  "video_stream_crashed_streamer" = "video_stream_crashed_streamer",
  "video_stream_crashed_viewer" = "video_stream_crashed_viewer",
  "video_stream_restarted_streamer" = "video_stream_restarted_streamer",
  "video_stream_restarted_viewer" = "video_stream_restarted_viewer",
  "stream_app_paused" = "stream_app_paused",
  "stream_app_unpaused" = "stream_app_unpaused",
  "stream_reaction" = "stream_reaction",
  "stream_message" = "stream_reaction",
  "stream_device_orientation_changed" = "stream_device_orientation_changed",
}

type EmitEvents = keyof typeof EmitEventsEnum;

class StreamContextProvider extends Component<{}, State> {
  static contextType = SocketContext;
  context!: React.ContextType<typeof SocketContext>;
  peerConnection: RTCPeerConnection = (null as unknown) as RTCPeerConnection;
  localStream: MediaStream = (null as unknown) as MediaStream;
  remoteStream: MediaStream = (null as unknown) as MediaStream;
  state = initialState;
  deviceId = sessionId;
  streamTitle = "";
  orientationIsLandscape = false;
  remoteDeviceId = "";
  blockedUsername = "";
  viewerCrashedTimeout = (null as unknown) as NodeJS.Timeout;
  deviceOrientationDataChannel = (null as unknown) as any;
  errorRetries: { [key in EmitEvents]: number } = {
    start_stream: 0,
    stream_ended: 0,
    leave_stream: 0,
    viewer_answered_stream: 0,
    streamer_block_viewer: 0,
    get_ice_configuration: 0,
    join_stream: 0,
    streamer_ice_candidate: 0,
    viewer_ice_candidate: 0,
    video_stream_crashed_streamer: 0,
    video_stream_crashed_viewer: 0,
    video_stream_restarted_streamer: 0,
    video_stream_restarted_viewer: 0,
    stream_app_paused: 0,
    stream_app_unpaused: 0,
    stream_reaction: 0,
    stream_message: 0,
    stream_device_orientation_changed: 0,
  };

  resetState = () => this.setState(initialState);

  resetInstanceVariables = () => {
    this.deviceId = sessionId;
    this.streamTitle = "";
    this.remoteDeviceId = "";
    this.blockedUsername = "";
  };

  emit = (event: EmitEvents, ...args: any[]) => {
    this.context.socket.emit(event, ...args);
  };

  initStreamSocketEvents = () => {
    const {
      streamStarted,
      streamViewerOffer,
      viewerJoinedOrLeft,
      videoStreamCrashed,
      videoStreamRestartViewer,
      streamUserInBackground,
      streamUserReturnedToForeground,
      streamReactionReceived,
      streamMessageReceived,
      streamReactionOnOtherDevice,
      streamerDeviceOrientationChanged,
    } = this;

    if (!this.context.socket) return;

    // turn off
    this.context.turnOffStreamListener(
      StreamEventListenersEnum.stream_started,
      streamStarted
    );

    this.context.turnOffStreamListener(
      StreamEventListenersEnum.stream_viewer_disconnected,
      viewerJoinedOrLeft
    );

    this.context.turnOffStreamListener(
      StreamEventListenersEnum.stream_new_viewer,
      viewerJoinedOrLeft
    );

    this.context.turnOffStreamListener(
      StreamEventListenersEnum.stream_viewer_offer,
      streamViewerOffer
    );

    this.context.turnOffStreamListener(
      StreamEventListenersEnum.stream_reaction_received,
      streamReactionReceived
    );

    this.context.turnOffStreamListener(
      StreamEventListenersEnum.stream_reaction_on_other_device,
      streamReactionOnOtherDevice
    );

    this.context.turnOffStreamListener(
      StreamEventListenersEnum.stream_message_received,
      streamMessageReceived
    );

    this.context.turnOffStreamListener(
      StreamEventListenersEnum.video_stream_crashed,
      videoStreamCrashed
    );
    this.context.turnOffStreamListener(
      StreamEventListenersEnum.video_stream_restart_viewer,
      videoStreamRestartViewer
    );

    this.context.turnOffStreamListener(
      StreamEventListenersEnum.stream_user_paused,
      streamUserInBackground
    );
    this.context.turnOffStreamListener(
      StreamEventListenersEnum.stream_user_unpaused,
      streamUserReturnedToForeground
    );

    this.context.turnOffStreamListener(
      StreamEventListenersEnum.streamer_device_orientation_changed,
      streamerDeviceOrientationChanged
    );

    // turn on

    this.context.turnOnStreamListener(
      StreamEventListenersEnum.stream_new_viewer,
      viewerJoinedOrLeft
    );

    this.context.turnOnStreamListener(
      StreamEventListenersEnum.stream_viewer_disconnected,
      viewerJoinedOrLeft
    );

    this.context.turnOnStreamListener(
      StreamEventListenersEnum.stream_started,
      streamStarted
    );

    this.context.turnOnStreamListener(
      StreamEventListenersEnum.stream_viewer_offer,
      streamViewerOffer
    );

    this.context.turnOnStreamListener(
      StreamEventListenersEnum.stream_reaction_received,
      streamReactionReceived
    );

    this.context.turnOnStreamListener(
      StreamEventListenersEnum.stream_reaction_on_other_device,
      streamReactionOnOtherDevice
    );

    this.context.turnOnStreamListener(
      StreamEventListenersEnum.stream_message_received,
      streamMessageReceived
    );

    this.context.turnOnStreamListener(
      StreamEventListenersEnum.video_stream_crashed,
      videoStreamCrashed
    );

    this.context.turnOnStreamListener(
      StreamEventListenersEnum.video_stream_restart_viewer,
      videoStreamRestartViewer
    );

    this.context.turnOnStreamListener(
      StreamEventListenersEnum.stream_user_paused,
      streamUserInBackground
    );
    this.context.turnOnStreamListener(
      StreamEventListenersEnum.stream_user_unpaused,
      streamUserReturnedToForeground
    );

    this.context.turnOnStreamListener(
      StreamEventListenersEnum.streamer_device_orientation_changed,
      streamerDeviceOrientationChanged
    );
  };

  socketEmitStatusCb = (
    event: EmitEvents,
    successCb: (dataCb?: any) => any
  ) => (status: "ok" | "error", data?: any) => {
    if (status === "error") {
      amplitudeTrack(AMPLITUDE_TRANSACTIONAL_EVENTS.stream_error, {
        event,
        description: "server_error",
      });
      this.errorHandler({ type: event });
    }
    if (status === "ok") {
      successCb(data);
    }
  };

  viewerJoinedOrLeft = (data: { numViewers: number }) => {
    this.setState({ numViewers: data.numViewers });
  };

  // streamer events
  startStream = async (
    streamTitle: string,
    orientationIsLandscape: boolean
  ) => {
    this.streamTitle = cleanIncomingText(streamTitle);
    this.orientationIsLandscape = orientationIsLandscape;
    this.peerConnection = await this.setupPeerConnection();
    this.localStream = await this.getStream({ isFront: true });
    this.peerConnection.addStream(this.localStream);
    const desc = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(desc);
    this.emit(
      "start_stream",
      {
        streamTitle,
        offer: desc,
      },
      this.socketEmitStatusCb("start_stream", () => {})
    );
    this.peerConnection.onicecandidate = (event) => {
      if (event?.candidate) {
        this.emit(
          `${this.deviceId}_streamer_ice_candidate` as "streamer_ice_candidate",
          {
            candidate: event.candidate,
          },
          this.socketEmitStatusCb(
            `${this.deviceId}_streamer_ice_candidate` as "streamer_ice_candidate",
            () => {}
          )
        );
      } else {
        this.emit(
          `${this.deviceId}_streamer_ice_candidate` as "streamer_ice_candidate",
          {
            candidate: { completed: true },
          },
          this.socketEmitStatusCb(
            `${this.deviceId}_streamer_ice_candidate` as "streamer_ice_candidate",
            () => {}
          )
        );
      }
    };
    InCallManager.start({ media: "video" });

    const { username, avatar } = await readCacheMulti(["username", "avatar"]);
    this.setState({
      isStreaming: true,
      localStreamURL: this.localStream.toURL(),
      streamData: {
        remoteDeviceId: sessionId,
        title: streamTitle,
        upvote: 0,
        downvote: 0,
        username,
        avatar,
        isFollowing: false,
        videoPaused: false,
        deviceOrientation: orientationIsLandscape ? "landscape" : "portrait",
      },
    });
  };

  streamStarted = async (data: { answer: RTCSessionDescriptionType }) => {
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );
  };

  // Not tied to event listener, called when local live streamer ends stream
  endStream = () => {
    showBanner({ message: "Your stream has ended." });
    this.emit(
      "stream_ended",
      this.socketEmitStatusCb("stream_ended", () => {})
    );
    this.cleanup();
  };

  // Tied to event listener, called when remote streams ends stream
  streamComplete = () => {
    if (this.viewerCrashedTimeout) clearInterval(this.viewerCrashedTimeout);
    this.emit(
      "leave_stream",
      {
        remoteDeviceId: this.state.streamData.remoteDeviceId,
        streamEnded: true,
      },
      this.socketEmitStatusCb("leave_stream", () => {})
    );
    showBanner({
      message: `${
        this.state.streamData.username || "The streamer"
      } has ended this stream.`,
    });
    this.cleanup();
  };

  joinStream = async (remoteDeviceId: string) => {
    InCallManager.setForceSpeakerphoneOn();
    this.remoteDeviceId = remoteDeviceId;
    ``;
    this.peerConnection = await this.setupPeerConnection();
    this.peerConnection.onicecandidate = (event) => {
      if (event?.candidate) {
        this.emit(
          `${this.deviceId}_viewer_ice_candidate` as "viewer_ice_candidate",
          {
            candidate: event.candidate,
          },
          this.socketEmitStatusCb(
            `${this.deviceId}_viewer_ice_candidate` as "viewer_ice_candidate",
            () => {}
          )
        );
      } else {
        this.emit(
          `${this.deviceId}_viewer_ice_candidate` as "viewer_ice_candidate",
          {
            candidate: { completed: true },
          },
          this.socketEmitStatusCb(
            `${this.deviceId}_viewer_ice_candidate` as "viewer_ice_candidate",
            () => {}
          )
        );
      }
    };
    const { username, avatar } = await readCacheMulti(["username", "avatar"]);
    this.setState({ viewerUserInfo: { username, avatar } });
    this.emit(
      "join_stream",
      {
        remoteDeviceId,
        viewerUserInfo: { username, avatar },
      },
      this.socketEmitStatusCb(
        "join_stream",
        (data: {
          streamData: StreamData;
          blockedUsers: { [index: string]: boolean };
          numViewers: number;
          currentReaction: "upvote" | "downvote";
        }) => {
          if (data) {
            const currentReactionObj: { [index: string]: boolean } = {};
            currentReactionObj[data.currentReaction] = true;
            this.setState({
              streamData: {
                ...data.streamData,
                title: cleanIncomingText(data.streamData.title),
              },
              blockedUsers: data.blockedUsers,
              numViewers: data.numViewers,
              reactionToggled: {
                ...initialState.reactionToggled,
                ...currentReactionObj,
              },
            });
          }
        }
      )
    );
    InCallManager.start({ media: "video" });
  };

  streamViewerOffer = async (data: {
    offer: RTCSessionDescriptionType;
    remoteDeviceId: string;
  }) => {
    this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.emit(
      "viewer_answered_stream",
      {
        answer,
        remoteDeviceId: data.remoteDeviceId,
      },
      this.socketEmitStatusCb("viewer_answered_stream", () => {})
    );
  };

  streamReaction = (data: ReactionEvent) => {
    this.emit(
      "stream_reaction",
      {
        remoteDeviceId: this.state.streamData.remoteDeviceId ?? this.deviceId,
        ...data,
      },
      this.socketEmitStatusCb("stream_reaction", () => {})
    );
    const currentReactionObj: { [index: string]: boolean } = {};
    currentReactionObj[data.type] = data.set;
    this.setState({
      reactionToggled: {
        ...initialState.reactionToggled,
        ...currentReactionObj,
      },
    });
  };

  streamReactionReceived = (data: ReactionEvent) => {
    switch (data.type) {
      case "upvote": {
        return this.setState({
          streamData: {
            ...this.state.streamData,
            upvote: data.value as number,
          },
        });
      }
      case "downvote": {
        return this.setState({
          streamData: {
            ...this.state.streamData,
            downvote: data.value as number,
          },
        });
      }
    }
  };

  streamReactionOnOtherDevice = (data: ReactionEvent) => {
    if (data) {
      const currentReactionObj: { [index: string]: boolean } = {};
      currentReactionObj[data.type] = data.set;
      this.setState({
        reactionToggled: {
          ...initialState.reactionToggled,
          ...currentReactionObj,
        },
      });
    }
  };

  streamMessage = (data: MessageEvent) => {
    this.emit(
      "stream_message",
      {
        remoteDeviceId: this.state.streamData.remoteDeviceId ?? this.deviceId,
        ...data,
      },
      this.socketEmitStatusCb("stream_message", () => {})
    );
  };

  streamMessageReceived = (data: MessageEventReceived) => {
    if (!this.state.blockedUsers[data.username])
      return this.setState((prevState) => ({
        messages: [
          // Take last 100 from stack
          ...(prevState.messages.length > 100
            ? prevState.messages.slice(
                Math.max(this.state.messages.length - 100, 0)
              )
            : prevState.messages),
          {
            username: data.username,
            avatar: data.avatar,
            message: cleanIncomingText(data.message),
            time: dayjs().format("H:mm"),
            deviceId: data.deviceId,
          },
        ],
      }));
  };

  leaveStream = () => {
    if (this.state.streamData.remoteDeviceId || this.remoteDeviceId) {
      this.emit(
        "leave_stream",
        {
          remoteDeviceId:
            this.state.streamData.remoteDeviceId || this.remoteDeviceId,
        },
        this.socketEmitStatusCb("leave_stream", () => {})
      );
      this.cleanup();
    }
  };

  streamerBlockingViewer = (username: string) => {
    if (
      this.state.streamData.username !== username &&
      this.state.viewerUserInfo.username !== username
    ) {
      this.blockedUsername = username;
      this.emit(
        "streamer_block_viewer",
        { username },
        this.socketEmitStatusCb("streamer_block_viewer", () => {})
      );
    } else {
      showBanner({ message: "Sorry, you can't block yourself!" });
    }
  };

  cleanup = () => {
    if (this.localStream) {
      if (this.state.isMuted) this.unmuteAudio();
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream.release();
    }
    InCallManager.stop();
    if (this.peerConnection) this.peerConnection.close();
    this.peerConnection = (null as unknown) as RTCPeerConnection;
    this.localStream = (null as unknown) as MediaStream;
    this.remoteStream = (null as unknown) as MediaStream;
    this.resetInstanceVariables();
    this.resetState();
  };

  getMediaDevicesInformation = async (): Promise<SourceInformation[]> => {
    return mediaDevices.enumerateDevices();
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

    peerConnection.onaddstream = (event) => {
      this.setState({ remoteStreamURL: event.stream.toURL() });
    };

    this.deviceOrientationDataChannel = peerConnection.createDataChannel(
      "device_orientation"
    );

    this.deviceOrientationDataChannel.onopen = (event: any) => {
      this.deviceOrientationDataChannel.send(
        this.orientationIsLandscape ? "landscape" : "portrait"
      );
    };

    return peerConnection;
  };

  getStream = async ({
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
          minWidth: 1920,
          minHeight: 1080,
          minFrameRate: 30,
        },
        facingMode: isFront ? "user" : "environment",
        optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
      },
    }) as unknown) as MediaStream;
  };

  flipCamera = () => {
    if (!this.localStream) return;
    const videoTrack = this.localStream.getVideoTracks()[0];
    this.setState({ localStreamURL: "" }, () => {
      videoTrack._switchCamera();
      this.setState({ localStreamURL: this.localStream.toURL() });
    });
  };

  assertUnreachable = (x: never): never => {
    throw new Error(
      "This case shouldn't be allowed in StreamContext. Your error handler isn't account for all cases."
    );
  };

  videoStreamCrashed = async () => {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream.release();
    }
    if (this.peerConnection) this.peerConnection.close();
    this.peerConnection = (null as unknown) as RTCPeerConnection;
    this.localStream = (null as unknown) as MediaStream;
    if (this.state.isStreaming) {
      this.peerConnection = await this.setupPeerConnection();
      this.localStream = await this.getStream({ isFront: true });
      this.peerConnection.addStream(this.localStream);
      const desc = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(desc);
      this.emit(
        "video_stream_crashed_streamer",
        {
          offer: desc,
        },
        this.socketEmitStatusCb("video_stream_crashed_streamer", () => {})
      );
      this.peerConnection.onicecandidate = (event) => {
        if (event?.candidate) {
          this.emit(
            `${this.deviceId}_streamer_ice_candidate` as "streamer_ice_candidate",
            {
              candidate: event.candidate,
            },
            this.socketEmitStatusCb("streamer_ice_candidate", () => {})
          );
        } else {
          this.emit(
            `${this.deviceId}_streamer_ice_candidate` as "streamer_ice_candidate",
            {
              candidate: { completed: true },
            },
            this.socketEmitStatusCb(
              `${this.deviceId}_streamer_ice_candidate` as "streamer_ice_candidate",
              () => {}
            )
          );
        }
      };
      this.setState({
        localStreamURL: this.localStream.toURL(),
      });
    } else {
      showBanner({ message: "Video stream died, trying to reconnect now..." });
      this.viewerCrashedTimeout = setTimeout(async () => {
        this.peerConnection = await this.setupPeerConnection();
        this.peerConnection.onicecandidate = (event) => {
          if (event?.candidate) {
            this.emit(
              `${this.deviceId}_viewer_ice_candidate` as "viewer_ice_candidate",
              {
                candidate: event.candidate,
              },
              this.socketEmitStatusCb("viewer_ice_candidate", () => {})
            );
          } else {
            this.emit(
              `${this.deviceId}_viewer_ice_candidate` as "viewer_ice_candidate",
              {
                candidate: { completed: true },
              },
              this.socketEmitStatusCb(
                `${this.deviceId}_viewer_ice_candidate` as "viewer_ice_candidate",
                () => {}
              )
            );
          }
        };

        this.emit(
          "video_stream_crashed_viewer",
          {
            remoteDeviceId: this.remoteDeviceId,
          },
          this.socketEmitStatusCb("video_stream_crashed_viewer", () => {})
        );
      }, 4000);
    }
  };

  // fired from client
  videoStreamRestartedStreamer = async () => {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream.release();
    }
    if (this.peerConnection) this.peerConnection.close();
    this.peerConnection = (null as unknown) as RTCPeerConnection;
    this.localStream = (null as unknown) as MediaStream;
    this.peerConnection = await this.setupPeerConnection();
    this.localStream = await this.getStream({ isFront: true });
    this.peerConnection.addStream(this.localStream);
    const desc = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(desc);
    this.emit(
      "video_stream_restarted_streamer",
      {
        offer: desc,
      },
      this.socketEmitStatusCb("video_stream_restarted_streamer", () => {})
    );
    this.peerConnection.onicecandidate = (event) => {
      if (event?.candidate) {
        this.emit(
          `${this.deviceId}_streamer_ice_candidate` as "streamer_ice_candidate",
          {
            candidate: event.candidate,
          },
          this.socketEmitStatusCb("streamer_ice_candidate", () => {})
        );
      } else {
        this.emit(
          `${this.deviceId}_streamer_ice_candidate` as "streamer_ice_candidate",
          {
            candidate: { completed: true },
          },
          this.socketEmitStatusCb(
            `${this.deviceId}_streamer_ice_candidate` as "streamer_ice_candidate",
            () => {}
          )
        );
      }
    };
    this.setState({
      localStreamURL: this.localStream.toURL(),
    });
  };

  // received through socket
  videoStreamRestartViewer = async () => {
    showBanner({ message: "Reconnecting to stream now.." });
    this.viewerCrashedTimeout = setTimeout(async () => {
      this.peerConnection = await this.setupPeerConnection();
      this.peerConnection.onicecandidate = (event) => {
        if (event?.candidate) {
          this.emit(
            `${this.deviceId}_viewer_ice_candidate` as "viewer_ice_candidate",
            {
              candidate: event.candidate,
            },
            this.socketEmitStatusCb("viewer_ice_candidate", () => {})
          );
        } else {
          this.emit(
            `${this.deviceId}_viewer_ice_candidate` as "viewer_ice_candidate",
            {
              candidate: { completed: true },
            },
            this.socketEmitStatusCb(
              `${this.deviceId}_viewer_ice_candidate` as "viewer_ice_candidate",
              () => {}
            )
          );
        }
      };

      this.emit(
        "video_stream_restarted_viewer",
        {
          remoteDeviceId: this.remoteDeviceId,
        },
        this.socketEmitStatusCb("video_stream_restarted_viewer", () => {})
      );
    }, 4000);
  };

  streamNotAvailable = () => {
    this.cleanup();
  };

  toggleAudio = () => {
    this.localStream.getTracks().forEach((t: any) => {
      if (t.kind === "audio") t.enabled = !t.enabled;
    });
    this.setState((prevState) => ({ isMuted: !prevState.isMuted }));
  };

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

  appPaused = () => {
    this.emit(
      "stream_app_paused",
      this.socketEmitStatusCb("stream_app_paused", () => {})
    );
  };

  appUnPaused = () => {
    this.emit(
      "stream_app_unpaused",
      this.socketEmitStatusCb("stream_app_unpaused", () => {})
    );
  };

  orientationChanged = (orientationIsLandscape: boolean) => {
    this.orientationIsLandscape = orientationIsLandscape;
    this.emit(
      "stream_device_orientation_changed",
      { orientation: orientationIsLandscape ? "landscape" : "portrait" },
      this.socketEmitStatusCb("stream_device_orientation_changed", () => {})
    );
  };

  streamerDeviceOrientationChanged = (data: {
    orientation: DeviceOrientation;
  }) => {
    this.setState({
      streamData: {
        ...this.state.streamData,
        deviceOrientation: data.orientation,
      },
    });
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
    this.setState({ isLocalVideoPaused: false });
    this.appUnPaused();
  };

  disableLocalVideo = () => {
    this.localStream.getTracks().forEach((track) => {
      if (track.kind === "video") {
        track.enabled = false;
      }
    });
    this.setState({ isLocalVideoPaused: true });
    this.appPaused();
  };

  appInBackground = () => {
    this.muteAudio();
    this.disableLocalVideo();
  };

  appReturnedToForeground = () => {
    this.unmuteAudio();
    this.enableLocalVideo();
  };

  streamUserInBackground = () => {
    this.setState({
      streamData: { ...this.state.streamData, videoPaused: true },
    });
  };

  streamUserReturnedToForeground = () => {
    this.setState({
      streamData: { ...this.state.streamData, videoPaused: false },
    });
  };

  // local events
  errorHandler = (data: { type: EmitEvents }) => {
    if (this.errorRetries[data.type] >= 3) {
      this.errorRetries[data.type] = 0;
      return;
    }
    if (this.errorRetries[data.type] === undefined)
      this.errorRetries[data.type] = 0;
    else this.errorRetries[data.type] = this.errorRetries[data.type] + 1;
    switch (data.type) {
      case "start_stream": {
        const title = this.streamTitle;
        const orientationIsLandscape = this.orientationIsLandscape;
        this.cleanup();
        this.startStream(title, orientationIsLandscape);
        break;
      }
      case "stream_ended": {
        break;
      }
      case "streamer_block_viewer": {
        this.streamerBlockingViewer(this.blockedUsername);
        break;
      }
      case "stream_message":
      case "stream_reaction": {
        break;
      }
      case "join_stream": {
        const remoteDeviceId = this.remoteDeviceId;
        this.cleanup();
        this.joinStream(remoteDeviceId);
        break;
      }
      case "viewer_answered_stream": {
        const remoteDeviceId = this.remoteDeviceId;
        this.cleanup();
        this.joinStream(remoteDeviceId);
        break;
      }
      case "leave_stream": {
        break;
      }
      case "get_ice_configuration": {
        if (this.state.isStreaming) {
          const title = this.streamTitle;
          const orientationIsLandscape = this.orientationIsLandscape;
          this.cleanup();
          this.startStream(title, orientationIsLandscape);
        } else {
          const remoteDeviceId = this.remoteDeviceId;
          this.cleanup();
          this.joinStream(remoteDeviceId);
        }
        break;
      }
      case `${this.deviceId}_streamer_ice_candidate`: {
        const title = this.streamTitle;
        const orientationIsLandscape = this.orientationIsLandscape;

        this.cleanup();
        this.startStream(title, orientationIsLandscape);
        break;
      }
      case `${this.deviceId}_viewer_ice_candidate`: {
        const remoteDeviceId = this.remoteDeviceId;
        this.cleanup();
        this.joinStream(remoteDeviceId);
        break;
      }
      case "stream_app_paused": {
        break;
      }
      case "stream_app_unpaused": {
        break;
      }
      case "stream_device_orientation_changed": {
        break;
      }
      case "video_stream_restarted_streamer":
      case "video_stream_restarted_viewer":
      case "video_stream_crashed_streamer":
      case "video_stream_crashed_viewer": {
        showBanner({
          message:
            "We were unable to reconnect your video stream. Sorry about that.",
        });
        break;
      }
      default: {
        // this.assertUnreachable(data.type);
      }
    }
  };

  render() {
    return (
      <StreamContext.Provider
        value={{
          state: this.state,
          resetState: this.resetState,
          initStreamSocketEvents: this.initStreamSocketEvents,
          startStream: this.startStream,
          streamComplete: this.streamComplete,
          endStream: this.endStream,
          joinStream: this.joinStream,
          streamReaction: this.streamReaction,
          streamMessage: this.streamMessage,
          leaveStream: this.leaveStream,
          flipCamera: this.flipCamera,
          toggleAudio: this.toggleAudio,
          streamerBlockingViewer: this.streamerBlockingViewer,
          streamNotAvailable: this.streamNotAvailable,
          cleanup: this.cleanup,
          muteAudio: this.muteAudio,
          unmuteAudio: this.unmuteAudio,
          enableLocalVideo: this.enableLocalVideo,
          disableLocalVideo: this.disableLocalVideo,
          appInBackground: this.appInBackground,
          appReturnedToForeground: this.appReturnedToForeground,
          videoStreamRestartedStreamer: this.videoStreamRestartedStreamer,
          toggleLocalVideo: this.toggleLocalVideo,
          orientationChanged: this.orientationChanged,
        }}
      >
        {this.props.children}
      </StreamContext.Provider>
    );
  }
}

export { StreamContext, StreamContextProvider };
