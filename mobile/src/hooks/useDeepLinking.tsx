import DeepLinking from "react-native-deep-linking";
import { Linking } from "react-native";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  amplitudeTrack,
  AMPLITUDE_DEEP_LINKING_EVENTS,
} from "../utils/amplitude";

// Deep Link Params
export type DeepLinkViewLiveStreamParams = { deviceId: string };
export type DeepLinkViewPostParams = { postId: string };
export type DeepLinkViewProfileParams = { username: string };
export type DeepLinkViewConversationParams = { conversationId: string };

// All Deep Link Routes
export const constructProfileDeepLinkUrl = (username: string) =>
  `${deepLinkScheme}/profile/${username}`;

export const constructViewLiveStreamDeepLinkUrl = (deviceId: string) =>
  `${deepLinkScheme}/livestreams/${deviceId}`;

export const constructViewPostDeepLinkUrl = (postId: string) =>
  `${deepLinkScheme}/posts/${postId}`;

export const constructViewConversationDeepLinkUrl = (conversationId: string) =>
  `${deepLinkScheme}/conversation/${conversationId}`;

const handleUrl = ({ url }: { url: string }) => {
  Linking.canOpenURL(url).then(
    (supported) => supported && DeepLinking.evaluateUrl(url)
  );
};

type DeepLinkOptionsObject<T> = {
  setup: () => void;
  dispatch: (params: T) => void;
};

export type AllDeepLinkingParams =
  | DeepLinkViewProfileParams
  | DeepLinkViewLiveStreamParams
  | DeepLinkViewPostParams
  | DeepLinkViewConversationParams;

export type AllDeepLinkingOptions = {
  toViewProfile: DeepLinkOptionsObject<DeepLinkViewProfileParams>;
  toViewLiveStream: DeepLinkOptionsObject<DeepLinkViewLiveStreamParams>;
  toViewPost: DeepLinkOptionsObject<DeepLinkViewPostParams>;
  toViewConversation: DeepLinkOptionsObject<DeepLinkViewConversationParams>;
};

const deepLinkScheme = "https://foodfeed.live";

type Props = { beforeSetupCallback: () => Promise<void> };

/**
 * Only use this hook ONCE, at the starting screen of the app
 */
const useDeepLinking = ({
  beforeSetupCallback,
}: Props): [
  AllDeepLinkingOptions,
  boolean,
  React.Dispatch<React.SetStateAction<boolean>>
] => {
  const [initSetupComplete, setInitSetupComplete] = useState(false);
  const navigation = useNavigation();

  const setupDeepLinkOptions: AllDeepLinkingOptions = {
    toViewProfile: {
      dispatch: ({ username }) => {
        const url = constructProfileDeepLinkUrl(username);
        handleUrl({ url }),
          amplitudeTrack(AMPLITUDE_DEEP_LINKING_EVENTS.to_profile, { url });
      },
      setup: () => {
        if (initSetupComplete) return;
        DeepLinking.addRoute<DeepLinkViewProfileParams>(
          "/profile/:username",
          (response) => {
            const { username } = response;
            if (username) {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
              navigation.navigate("HomeStack", {
                screen: "Home",
                params: {
                  deepLinkScreen: "UneditableProfile",
                  username,
                },
              });
            }
          }
        );
      },
    },
    toViewLiveStream: {
      dispatch: ({ deviceId }) => {
        const url = constructViewLiveStreamDeepLinkUrl(deviceId);
        handleUrl({ url });
        amplitudeTrack(AMPLITUDE_DEEP_LINKING_EVENTS.to_view_live_stream, {
          url,
        });
      },
      setup: () => {
        if (initSetupComplete) return;
        DeepLinking.addRoute<DeepLinkViewLiveStreamParams>(
          "/livestreams/:deviceId",
          (response) => {
            const { deviceId } = response;
            if (deviceId) {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
              navigation.navigate("HomeStack", {
                screen: "Home",
                params: {
                  deepLinkScreen: "ViewLiveStream",
                  deviceId,
                },
              });
            }
          }
        );
      },
    },
    toViewPost: {
      dispatch: ({ postId }) => {
        const url = constructViewPostDeepLinkUrl(postId);
        handleUrl({ url });
        amplitudeTrack(AMPLITUDE_DEEP_LINKING_EVENTS.to_post, {
          url,
        });
      },
      setup: () => {
        if (initSetupComplete) return;
        DeepLinking.addRoute<DeepLinkViewPostParams>(
          "/posts/:postId",
          (response) => {
            const { postId } = response;
            if (postId) {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
              navigation.navigate("HomeStack", {
                screen: "Home",
                params: {
                  deepLinkScreen: "ViewPost",
                  postId,
                },
              });
            }
          }
        );
      },
    },
    toViewConversation: {
      dispatch: ({ conversationId }) => {
        const url = constructViewConversationDeepLinkUrl(conversationId);
        handleUrl({ url }),
          amplitudeTrack(AMPLITUDE_DEEP_LINKING_EVENTS.to_conversation, {
            url,
          });
      },
      setup: () => {
        if (initSetupComplete) return;
        DeepLinking.addRoute<DeepLinkViewConversationParams>(
          "/conversation/:conversationId",
          (response) => {
            const { conversationId } = response;
            if (conversationId) {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
              navigation.navigate("HomeStack", {
                screen: "Home",
                params: {
                  deepLinkScreen: "Conversations",
                  conversationId,
                },
              });
            }
          }
        );
      },
    },
  };

  useEffect(() => {
    if (initSetupComplete) return;
    (async () => {
      const url = await Linking.getInitialURL();
      if (initSetupComplete) {
        url && DeepLinking.evaluateUrl(url);
      } else {
        Linking.addEventListener("url", handleUrl);
        DeepLinking.addScheme(deepLinkScheme);
        setupDeepLinkOptions.toViewProfile.setup();
        setupDeepLinkOptions.toViewLiveStream.setup();
        setupDeepLinkOptions.toViewPost.setup();
        setupDeepLinkOptions.toViewConversation.setup();
        setInitSetupComplete(true);
        await beforeSetupCallback();
        url && DeepLinking.evaluateUrl(url);
      }
    })();
    return () => Linking.removeEventListener("url", handleUrl);
  }, []);

  return [setupDeepLinkOptions, initSetupComplete, setInitSetupComplete];
};

export default useDeepLinking;
