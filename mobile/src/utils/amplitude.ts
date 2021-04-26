import amplitudeInstance, {
  AmplitudeClient,
  Callback,
  Config,
  LogReturn,
} from "amplitude-js";

import ENV from "../../env";
import { Platform } from "react-native";
import { sessionId } from "./session";

type AmplitudeClientOverride = Omit<AmplitudeClient, "logEvent"> & {
  logEvent: (
    event: AmplitudeEvents,
    data?: any,
    callback?: Callback
  ) => LogReturn;
};

export const amplitude: AmplitudeClientOverride = amplitudeInstance.getInstance();

export type LogEvent = (
  event: AmplitudeEvents,
  data?: any,
  callback?: Callback
) => LogReturn;
export type VoidFunc = () => void;

amplitude.init(ENV.AMPLITUDE_API_KEY);

export const amplitudeTrack = (
  event: AmplitudeEvents,
  data?: any,
  callback?: Callback
): LogReturn | void => {
  if (process.env.NODE_ENV === "production") {
    return amplitude.logEvent(event, data, callback);
  }
};

export const generateAmplitudeLoggedInConfig = (userId: string): Config => {
  return {
    userId,
    deviceId: sessionId,
    platform: Platform.select({
      ios: "mobile-ios",
      android: "android-ios",
      default: "mobile-other",
    }),
  };
};

type AmplitudeEvents =
  | keyof typeof AMPLITUDE_LIFETIME_EVENTS
  | keyof typeof AMPLITUDE_TRANSACTIONAL_EVENTS
  | keyof typeof AMPLITUDE_SHARING_EVENTS
  | keyof typeof AMPLITUDE_DEEP_LINKING_EVENTS
  | keyof typeof AMPLITUDE_MISCELLANEOUS_EVENTS;

/**
 * Events that generally only happen once per account/download/session
 */
export enum AMPLITUDE_LIFETIME_EVENTS {
  init_download = "init_download",
  open_app = "open_app",
  sign_up_completed = "sign_up_completed",
  sign_in_completed = "sign_in_completed",
  onboarding_started = "onboarding_started",
  onboarding_completed_name_gender = "onboarding_completed_name_gender",
  onboarding_completed_select_interests = "onboarding_completed_select_interests",
  onboarding_completed_all = "onboarding_completed_all",
}

/**
 * Events that can happen multiple times per usage session
 */
export enum AMPLITUDE_TRANSACTIONAL_EVENTS {
  // Frontend
  join_waiting_room = "join_waiting_room",
  call_error = "call_error",
  stream_error = "stream_error",
  ad_clicked = "ad_clicked",
  ad_impression = "ad_impression",
  ad_failed = "ad_failed",
  conversation_error = "conversation_error",
  activity_error = "activity_error",
}

export enum AMPLITUDE_SHARING_EVENTS {
  share_stream = "share_stream",
  share_profile = "share_profile",
  share_post = "share_post",
}

// Tied to AllDeepLinkingOptions
export enum AMPLITUDE_DEEP_LINKING_EVENTS {
  to_profile = "to_profile",
  to_post = "to_post",
  to_view_live_stream = "to_view_live_stream",
  to_conversation = "to_conversation",
}

export enum AMPLITUDE_MISCELLANEOUS_EVENTS {
  pressed_stream_history_item = "pressed_stream_history_item",
}
