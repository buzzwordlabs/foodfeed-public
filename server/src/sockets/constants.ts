// socket room constants
export enum SocketRooms {
  GLOBAL_ROOM = 'foodfeedglobal',
  STREAM_ROOM = 'foodfeedstreams',
  WAITING_ROOM = 'foodfeedwaitingroom'
}

// general socket events
export enum SocketConnectionEvents {
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  AUTHENTICATED = 'authenticated',
  AUTHENTICATE = 'authenticate',
  USER_SESSION = 'userSession',
  UNAUTHORIZED = 'unauthorized'
}

export enum SocketClientConnectionEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  RECONNECT_FAILED = 'reconnect_failed'
}

// client socket helper events
export enum ClientHelperEvents {
  NUMBER_ONLINE_USERS = 'number_online_users',
  NUMBER_ONLINE_USERS_IN_WAITING_ROOM = 'number_online_users_in_waiting_room'
}

// server socket one_to_one events
export enum ServerCallEvents {
  JOINED_WAITING_ROOM = 'joined_waiting_room',
  LEAVE_WAITING_ROOM = 'leave_waiting_room',
  FIND_USERS_TO_CALL = 'find_users_to_call',
  CALLEE_MAKES_ANSWER_TO_CALLER = 'callee_makes_answer_to_caller',
  CALL_ENDED = 'call_ended',
  CALL_ON_ICE_CANDIDATE = 'call_on_ice_candidate',
  CALL_APP_PAUSED = 'call_app_paused',
  CALL_APP_UNPAUSED = 'call_app_unpaused',
  CALLER_MAKES_OFFER_TO_CALLEE = 'caller_makes_offer_to_callee',
  CALL_REJECTED = 'call_rejected',
  REJOIN_WAITING_ROOM = 'rejoin_waiting_room',
  CALL_ACCEPTED = 'call_accepted'
}

// client socket one_to_one events
export enum ClientCallEvents {
  CALLER_RECEIVES_CALLEE_ANSWER = 'caller_receives_callee_answer',
  NO_USERS_FOUND_FOR_CALL = 'no_users_found_for_call',
  ONE_TO_ONE_CALL_ID = 'one_to_one_call_id',
  CALL_ON_ICE_CANDIDATE_RECEIVED = 'call_on_ice_candidate_received',
  REMOTE_USER_DISCONNECTED = 'remote_user_disconnected',
  CALL_UNKNOWN_ERROR = 'call_unknown_error',
  CALL_USER_PAUSED = 'call_user_paused',
  CALL_USER_UNPAUSED = 'call_user_unpaused',
  CALLEE_RECEIVES_CALLER_OFFER = 'callee_receives_caller_offer',
  REMOTE_CALL_REJECTED = 'remote_call_rejected',
  REMOTE_POTENTIAL_MATCH = 'remote_potential_match',
  INITIATE_CALL = 'initiate_call'
}

export enum ServerConversationEvents {
  JOIN_CONVERSATION_ROOMS = 'join_conversation_rooms',
  SEND_MESSAGE = 'send_message',
  DELETE_MESSAGE = 'delete_message',
  REACT_MESSAGE = 'react_message',
  CREATE_CONVERSATION = 'create_conversation',
  GET_CONVERSATIONS = 'get_conversations',
  GET_CONVERSATION = 'get_conversation',
  GET_UNREAD_MESSAGE_COUNT = 'get_unread_message_count',
  GET_MESSAGES = 'get_messages',
  READ_MESSAGE = 'read_message',
  GET_UNREAD_ACTIVITY_COUNT = 'get_unread_activity_count',
  BLOCK_PARTICIPANT = 'block_participant',
  UNBLOCK_PARTICIPANT = 'unblock_participant'
}

export enum ClientActivityEvents {
  UNREAD_ACTIVITY_COUNT = 'unread_activity_count'
}

export enum ClientConversationEvents {
  CONVERSATION_NEW_MESSAGE = 'conversation_new_message',
  CONVERSATION_MESSAGE_DELETED = 'conversation_message_deleted',
  CONVERSATION_MESSAGE_REACTED = 'conversation_message_reacted',
  CONVERSATION_OTHER_MESSAGE_READ = 'conversation_other_message_read',
  CONVERSATIONS_NEW_CONVERSATION = 'conversations_new_conversation',
  CONVERSATIONS_NEW_MESSAGE = 'conversations_new_message',
  CONVERSATIONS_MESSAGE_READ = 'conversations_message_read',
  UNREAD_MESSAGES_COUNT = 'unread_messages_count',
  UNREAD_MESSAGES_COUNT_INCREMENT = 'unread_messages_count_increment',
  UNREAD_MESSAGES_COUNT_DECREMENT = 'unread_messages_count_decrement',
  CONVERSATION_BLOCKED_BY_OTHER_PARTICIPANT = 'conversation_blocked_by_other_participant',
  CONVERSATION_UNBLOCKED_BY_OTHER_PARTICIPANT = 'conversation_unblocked_by_other_participant'
}

// server socket stream events
export enum ServerStreamEvents {
  START_STREAM = 'start_stream',
  STREAM_ENDED = 'stream_ended',
  JOIN_STREAM = 'join_stream',
  STREAMER_MAKES_OFFER_TO_NEW_VIEWER = 'streamer_makes_offer_to_new_viewer',
  VIEWER_MAKES_ANSWER_TO_STREAMER_OFFER = 'viewer_makes_answer_to_streamer_offer',
  VIEWER_ANSWERED_STREAM = 'viewer_answered_stream',
  LEAVE_STREAM = 'leave_stream',
  STREAM_MESSAGE = 'stream_message',
  VIDEO_STREAM_CRASHED_STREAMER = 'video_stream_crashed_streamer',
  VIDEO_STREAM_CRASHED_VIEWER = 'video_stream_crashed_viewer',
  VIDEO_STREAM_RESTARTED_STREAMER = 'video_stream_restarted_streamer',
  VIDEO_STREAM_RESTARTED_VIEWER = 'video_stream_restarted_viewer',
  STREAM_APP_PAUSED = 'stream_app_paused',
  STREAM_APP_UNPAUSED = 'stream_app_unpaused',
  STREAM_REACTION = 'stream_reaction',
  STREAM_DEVICE_ORIENTATION_CHANGED = 'stream_device_orientation_changed'
}

export enum ClientStreamErrorEvents {
  STREAMER_BLOCK_VIEWER = 'streamer_block_viewer',
  STREAM_NOT_AVAILABLE = 'stream_not_available'
}

// client socket stream events
export enum ClientStreamEvents {
  STREAM_ERROR = 'stream_error',
  STREAM_UNKNOWN_ERROR = 'stream_unknown_error',
  STREAM_COMPLETE = 'stream_complete',
  RETURN_LIST_OF_STREAMS = 'return_list_of_streams',
  STREAM_JOINED = 'stream_joined',
  STREAM_NEW_VIEWER = 'stream_new_viewer',
  STREAM_VIEWER_DISCONNECTED = 'stream_viewer_disconnected',
  STREAM_REACTION_RECEIVED = 'stream_reaction_received',
  STREAM_MESSAGE_RECEIVED = 'stream_message_received',
  VIEWER_RECEIVES_STREAMER_OFFER = 'viewer_receives_streamer_offer',
  STREAMER_RECEIVES_VIEWER_ANSWER = 'streamer_receives_viewer_answer',
  STREAM_ICE_CANDIDATE_RECEIVED = 'stream_ice_candidate_received',
  VIDEO_STREAM_RESTART_VIEWER = 'video_stream_restart_viewer',
  STREAM_USER_UNPAUSED = 'stream_user_unpaused',
  STREAM_USER_PAUSED = 'stream_user_paused',
  STREAM_REACTION_ON_OTHER_DEVICE = 'stream_reaction_on_other_device',
  STREAMER_DEVICE_ORIENTATION_CHANGED = 'streamer_device_orientation_changed'
}

export enum JanusManagerEvents {
  START_STREAM_JANUS = 'start_stream_janus',
  STREAM_ENDED_JANUS = 'stream_ended_janus',
  JOINED_STREAM_JANUS = 'joined_stream_janus',
  VIEWER_ANSWERED_STREAMER_JANUS = 'viewer_answered_streamer_janus',
  VIEWER_LEFT_STREAM_JANUS = 'viewer_left_stream_janus'
}

export enum JanusManagerToClientEvents {
  STREAM_VIEWER_OFFER = 'stream_viewer_offer',
  STREAM_STARTED = 'stream_started',
  VIDEO_STREAM_CRASHED = 'video_stream_crashed'
}

export enum JanusManagerToServerEvents {
  JANUS_MANAGER_CRASHED = 'janus_manager_crashed'
}

export enum JanusManagerRedisData {
  JANUSMANAGERS = 'janus_managers',
  JANUSMANAGERSTATUS = 'janus_manager_status'
}

export enum AMPLITUDE_TRANSACTIONAL_EVENTS {
  VIEW_LIVE_STREAM = 'view_live_stream',
  COMPLETED_LIVE_STREAM = 'completed_live_stream',
  SUBMIT_LIVE_STREAM_COMMENT_AS_STREAMER = 'submit_live_stream_comment_as_streamer',
  SUBMIT_LIVE_STREAM_COMMENT_AS_VIEWER = 'submit_live_stream_comment_as_viewer',
  SUBMIT_LIVE_STREAM_REACTION_AS_STREAMER = 'submit_live_stream_reaction_as_streamer',
  SUBMIT_LIVE_STREAM_REACTION_AS_VIEWER = 'submit_live_stream_reaction_as_viewer',
  JOIN_CALL = 'join_call',
  NO_FRIENDLY_CALLS = 'no_friendly_calls'
}
