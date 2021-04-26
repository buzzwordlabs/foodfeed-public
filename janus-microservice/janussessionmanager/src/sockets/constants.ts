// general socket server events
export enum SocketConnectionEvents {
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  AUTHENTICATED = 'authenticated',
  CONNECT = 'connect',
  UNAUTHORIZED = 'unauthorized'
}

// errors to emit back
export enum JanusManagerErrorEvents {
  STREAM_JANUS_UNKNOWN_ERROR = 'stream_janus_unknown_error',
  START_STREAM_JANUS_ERROR = 'start_stream_janus_error',
  JOIN_STREAM_JANUS_ERROR = 'join_stream_janus_error',
  JANUS_MANAGER_CRASHED = 'janus_manager_crashed'
}

export enum JanusManagerServerEvents {
  START_STREAM_JANUS = 'start_stream_janus',
  STREAM_ENDED_JANUS = 'stream_ended_janus',
  JOINED_STREAM_JANUS = 'joined_stream_janus',
  VIEWER_LEFT_STREAM_JANUS = 'viewer_left_stream_janus',
  VIEWER_ANSWERED_STREAMER_JANUS = 'viewer_answered_streamer_janus'
}

export enum JanusManagerRedisData {
  JANUSMANAGERS = 'janus_managers',
  JANUSMANAGERSTATUS = 'janus_manager_status'
}
