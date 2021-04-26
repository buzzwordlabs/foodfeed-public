export enum AMPLITUDE_ACCOUNT_EVENTS {
  DELETED_ACCOUNT = 'deleted_account'
}

export enum AMPLITUDE_POST_EVENTS {
  CREATE_POST = 'create_post',
  DELETE_POST = 'delete_post',
  EDIT_POST = 'edit_post',
  REACT_POST = 'react_post',
  UNREACT_POST = 'unreact_post',
  MAKE_COMMENT = 'make_comment',
  EDIT_COMMENT = 'edit_comment',
  DELETE_COMMENT = 'delete_comment',
  REREACT_POST = 'rereact_post'
}

export enum AMPLITUDE_ACTIVITY_EVENTS {
  SESSION_DURATION = 'session_duration'
}

export enum AMPLITUDE_CONVERSATION_EVENTS {
  NEW_CONVERSATION = 'new_conversation',
  NEW_MESSAGE = 'new_message',
  NEW_REACTION = 'new_reaction',
  PARTICIPANT_BLOCKED = 'participant_blocked',
  PARTICIPANT_UNBLOCKED = 'participant_unblocked'
}
