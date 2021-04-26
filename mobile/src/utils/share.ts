import { constructViewPostDeepLinkUrl } from "./../hooks/useDeepLinking";

import { Platform } from "react-native";
import Share, { Options } from "react-native-share";
import {
  AllDeepLinkingParams,
  AllDeepLinkingOptions,
  DeepLinkViewLiveStreamParams,
  DeepLinkViewProfileParams,
  DeepLinkViewPostParams,
  constructProfileDeepLinkUrl,
  constructViewLiveStreamDeepLinkUrl,
} from "../hooks/useDeepLinking";
import { amplitudeTrack, AMPLITUDE_SHARING_EVENTS } from "./amplitude";

type ConstructDefaultOptionsArgs = {
  title: string;
  message: string;
  url: string;
};

const constructDefaultOptions = ({
  title,
  message,
  url,
}: ConstructDefaultOptionsArgs) => {
  const options: Options = Platform.select({
    ios: {
      activityItemSources: [
        {
          placeholderItem: { type: "url", content: url },
          item: { default: { type: "url", content: url } },
          subject: { default: title },
          linkMetadata: { originalUrl: url, url, title },
          message,
        },
      ],
    },
    default: {
      title,
      subject: title,
      message: `${message} ${url}`,
    },
  });
  return options;
};

type ShareTypes = keyof AllDeepLinkingOptions | "webview_link";

type LaunchShareArgs = {
  title: string;
  message: string;
  type: ShareTypes;
  deepLinkArgs?: AllDeepLinkingParams;
  url?: string;
};

/**
 * Closely tied to universal linking
 */
export const launchShare = async ({
  type,
  deepLinkArgs,
  message,
  title,
  url,
}: LaunchShareArgs) => {
  if (type === "toViewProfile") {
    const { username } = deepLinkArgs as DeepLinkViewProfileParams;
    return Share.open(
      constructDefaultOptions({
        url: constructProfileDeepLinkUrl(username),
        message,
        title,
      })
    )
      .then(({ app }) =>
        amplitudeTrack(AMPLITUDE_SHARING_EVENTS.share_profile, {
          username,
          app,
        })
      )
      .catch(() => {});
  } else if (type === "toViewLiveStream") {
    const { deviceId } = deepLinkArgs as DeepLinkViewLiveStreamParams;
    return Share.open(
      constructDefaultOptions({
        url: constructViewLiveStreamDeepLinkUrl(deviceId),
        message,
        title,
      })
    )
      .then(({ app }) =>
        amplitudeTrack(AMPLITUDE_SHARING_EVENTS.share_profile, {
          deviceId,
          app,
        })
      )
      .catch(() => {});
  } else if (type === "toViewPost") {
    const { postId } = deepLinkArgs as DeepLinkViewPostParams;
    return Share.open(
      constructDefaultOptions({
        url: constructViewPostDeepLinkUrl(postId),
        message,
        title,
      })
    )
      .then(({ app }) =>
        amplitudeTrack(AMPLITUDE_SHARING_EVENTS.share_post, {
          postId,
          app,
        })
      )
      .catch(() => {});
  } else if (type === "webview_link") {
    if (url) {
      return Share.open(
        constructDefaultOptions({
          url: url!,
          message,
          title,
        })
      ).catch(() => {});
    }
  } else {
    throw Error("type was not any of the valid options");
  }
};
