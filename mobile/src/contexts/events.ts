export enum SocketEventListenersEnum {
  "authenticated" = "authenticated",
  "unauthorized" = "unauthorized",
}

export enum StreamEventListenersEnum {
  stream_started = "stream_started",
  stream_joined = "stream_joined",
  stream_viewer_offer = "stream_viewer_offer",
  stream_viewer_disconnected = "stream_viewer_disconnected",
  stream_new_viewer = "stream_new_viewer",
  stream_event_received = "stream_event_received",
  stream_viewer_blocked = "stream_viewer_blocked",
  stream_complete = "stream_complete",
  stream_error = "stream_error",
  video_stream_crashed = "video_stream_crashed",
  video_stream_restart_viewer = "video_stream_restart_viewer",
  stream_user_paused = "stream_user_paused",
  stream_user_unpaused = "stream_user_unpaused",
  stream_reaction_received = "stream_reaction_received",
  stream_message_received = "stream_message_received",
  stream_reaction_on_other_device = "stream_reaction_on_other_device",
  streamer_device_orientation_changed = "streamer_device_orientation_changed",
}

export enum CallEventListenersEnum {
  caller_receives_callee_answer = "caller_receives_callee_answer",
  call_on_ice_candidate_received = "call_on_ice_candidate_received",
  remote_user_disconnected = "remote_user_disconnected",
  one_to_one_call_id = "one_to_one_call_id",
  number_online_users_in_waiting_room = "number_online_users_in_waiting_room",
  call_unknown_error = "call_unknown_error",
  no_users_found_for_call = "no_users_found_for_call",
  call_user_paused = "call_user_paused",
  call_user_unpaused = "call_user_unpaused",
  callee_receives_caller_offer = "callee_receives_caller_offer",
  remote_call_rejected = "remote_call_rejected",
  remote_potential_match = "remote_potential_match",
  initiate_call = "initiate_call",
}

export enum ActivityEventListenersEnum {
  unread_activity_count = "unread_activity_count",
}

export enum ConversationEventListenersEnum {
  conversation_new_message = "conversation_new_message",
  conversation_message_deleted = "conversation_message_deleted",
  conversation_message_reacted = "conversation_message_reacted",
  conversation_other_message_read = "conversation_other_message_read",
  conversations_new_conversation = "conversations_new_conversation",
  conversations_new_message = "conversations_new_message",
  conversations_message_read = "conversations_message_read",
  unread_messages_count = "unread_messages_count",
  unread_messages_count_increment = "unread_messages_count_increment",
  unread_messages_count_decrement = "unread_messages_count_decrement",
  conversation_unblocked_by_other_participant = "conversation_unblocked_by_other_participant",
  conversation_blocked_by_other_participant = "conversation_blocked_by_other_participant",
}
