import {
  Notifications,
  Registered,
  RegistrationError,
} from "react-native-notifications";
import { useEffect, useState } from "react";
import { getUniqueId, isEmulator } from "react-native-device-info";

import { NotificationCompletion } from "react-native-notifications/lib/dist/interfaces/NotificationCompletion";
import useDeepLinking from "./useDeepLinking";
import { useRequest } from "./useRequest";
import { Platform, EmitterSubscription } from "react-native";
import { checkPermission, requestPermission, readCache } from "../utils";
import useModal from "./useModal";
import { PermissionStatus } from "react-native-permissions";

type Notification = {
  payload: {
    body: string;
    identifier: string;
    date: string;
    category: string;
    title: string;
    thread: string;
  };
};

type DeepLinkNewFollowerNotificationData = {
  username: string;
};

type DeepLinkNewLiveStreamNotificationData = {
  deviceId: string;
};

type DeepLinkNewPostInteractionNotificationData = {
  postId: string;
};

export type DeepLinkNewMessageInformationNotificationData = {
  conversationId: string;
};

type DeepLinkNewFollowerNotification = {
  payload: {
    type: DeepLinkNotificationTypes.deeplink_new_follower;
  } & Notification &
    DeepLinkNewFollowerNotificationData;
};

type DeepLinkNewLiveStreamNotification = {
  payload: {
    type: DeepLinkNotificationTypes.deeplink_new_livestream;
  } & Notification &
    DeepLinkNewLiveStreamNotificationData;
};

type DeepLinkNewPostInteractionNotification = {
  payload: {
    type: DeepLinkNotificationTypes.deeplink_new_livestream;
  } & Notification &
    DeepLinkNewPostInteractionNotificationData;
};

type DeepLinkNewMessageReactionNotification = {
  payload: {
    type: DeepLinkNotificationTypes.deeplink_new_message_information;
  } & Notification &
    DeepLinkNewMessageInformationNotificationData;
};

enum DeepLinkNotificationTypes {
  deeplink_new_follower = "deeplink_new_follower",
  deeplink_new_livestream = "deeplink_new_livestream",
  deeplink_new_post_interaction = "deeplink_new_post_interaction",
  deeplink_new_message_information = "deeplink_new_message_information",
}

type DeepLinkNotification =
  | DeepLinkNewLiveStreamNotification
  | DeepLinkNewFollowerNotification
  | DeepLinkNewPostInteractionNotification
  | DeepLinkNewMessageReactionNotification;

type DeepLinkNotificationData =
  | DeepLinkNewLiveStreamNotificationData
  | DeepLinkNewFollowerNotificationData
  | DeepLinkNewPostInteractionNotificationData
  | DeepLinkNewMessageInformationNotificationData;

/**
 * Used only once in the app, for handling notifications
 */
const useNotifications = (): [
  (
    notificationsStatus: PermissionStatus
  ) => Promise<{
    registerRemoteNotificationsRegistered: EmitterSubscription;
    registerRemoteNotificationsRegistrationFailed: EmitterSubscription;
    registerNotificationReceivedForeground: EmitterSubscription;
    registerNotificationReceivedBackground: EmitterSubscription;
    registerNotificationOpened: EmitterSubscription;
  }>
] => {
  // @ts-ignore
  const [setupDeepLinkOptions] = useDeepLinking({
    beforeSetupCallback: async () => {
      try {
        const notificationsStatus = await checkPermission("notifications");
        if (notificationsStatus === "granted") {
          const initialNotification = await Notifications.getInitialNotification();
          if (
            initialNotification &&
            containsDeepLinkSubstring(initialNotification.payload.type)
          ) {
            switch (
              initialNotification.payload
                .type as keyof typeof DeepLinkNotificationTypes
            ) {
              case "deeplink_new_follower":
                handleDeepLinkDispatch(initialNotification.payload.type, {
                  username: initialNotification.payload.username,
                });
                break;
              case "deeplink_new_livestream":
                handleDeepLinkDispatch(initialNotification.payload.type, {
                  deviceId: initialNotification.payload.deviceId,
                });
                break;
              case "deeplink_new_post_interaction":
                handleDeepLinkDispatch(initialNotification.payload.type, {
                  postId: initialNotification.payload.postId,
                });
                break;
              case "deeplink_new_message_information":
                handleDeepLinkDispatch(initialNotification.payload.type, {
                  conversationId: initialNotification.payload.conversationId,
                });
                break;
            }
          }
        }
      } catch (err) {}
    },
  });

  const [request] = useRequest();
  const [isSetUp, setIsSetUp] = useState(false);
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    let registerRemoteNotificationsRegistered: EmitterSubscription;
    let registerRemoteNotificationsRegistrationFailed: EmitterSubscription;
    let registerNotificationReceivedForeground: EmitterSubscription;
    let registerNotificationReceivedBackground: EmitterSubscription;
    let registerNotificationOpened: EmitterSubscription;

    (async () => {
      let notificationsStatus = await checkPermission("notifications");
      const askedInitialRequestPermissions = await readCache(
        "askedInitialRequestPermissions"
      );
      if (
        notificationsStatus === "denied" &&
        askedInitialRequestPermissions &&
        Math.random() <= 0.2
      ) {
        openModal("GenericModal", {
          title: "Notifications",
          description:
            "Mind if we give you a nudge when something cool happens? 🥺 \n\n You'll get notifications for things like new followers, likes, comments.",
          options: [
            {
              title: "Sure! 👍",
              onPress: async () => {
                notificationsStatus = await requestPermission("notifications");
                closeModal("GenericModal");
                await handleSetup(notificationsStatus);
              },
              highlight: true,
            },
            {
              title: "Later 👎",
              onPress: () => closeModal("GenericModal"),
              textOnly: true,
            },
          ],
        });
      } else {
        const emitterSubscriptions = await handleSetup(notificationsStatus);
        registerRemoteNotificationsRegistered =
          emitterSubscriptions.registerRemoteNotificationsRegistered;
        registerRemoteNotificationsRegistrationFailed =
          emitterSubscriptions.registerRemoteNotificationsRegistrationFailed;
        registerNotificationReceivedForeground =
          emitterSubscriptions.registerNotificationReceivedForeground;
        registerNotificationReceivedBackground =
          emitterSubscriptions.registerNotificationReceivedBackground;
        registerNotificationOpened =
          emitterSubscriptions.registerNotificationOpened;
      }
    })();
    return () => {
      try {
        registerRemoteNotificationsRegistered?.remove();
        registerRemoteNotificationsRegistrationFailed?.remove();
        registerNotificationReceivedForeground?.remove();
        registerNotificationReceivedBackground?.remove();
        registerNotificationOpened?.remove();
      } catch (err) {}
    };
  }, []);

  const handleSetup = async (notificationsStatus: PermissionStatus) => {
    let registerRemoteNotificationsRegistered: EmitterSubscription = (null as unknown) as EmitterSubscription;
    let registerRemoteNotificationsRegistrationFailed: EmitterSubscription = (null as unknown) as EmitterSubscription;
    let registerNotificationReceivedForeground: EmitterSubscription = (null as unknown) as EmitterSubscription;
    let registerNotificationReceivedBackground: EmitterSubscription = (null as unknown) as EmitterSubscription;
    let registerNotificationOpened: EmitterSubscription = (null as unknown) as EmitterSubscription;

    if (
      !(await isEmulator()) &&
      !isSetUp &&
      notificationsStatus === "granted"
    ) {
      Notifications.registerRemoteNotifications();

      registerRemoteNotificationsRegistered = Notifications.events().registerRemoteNotificationsRegistered(
        handleRegister
      );

      registerRemoteNotificationsRegistrationFailed = Notifications.events().registerRemoteNotificationsRegistrationFailed(
        handleRegistrationFail
      );

      registerNotificationReceivedForeground = Notifications.events().registerNotificationReceivedForeground(
        handleIncomingForegroundNotification
      );

      registerNotificationReceivedBackground = Notifications.events().registerNotificationReceivedBackground(
        handleIncomingBackgroundNotification
      );

      registerNotificationOpened = Notifications.events().registerNotificationOpened(
        handleNotificationOpened
      );

      setIsSetUp(true);
    }

    return {
      registerRemoteNotificationsRegistered,
      registerRemoteNotificationsRegistrationFailed,
      registerNotificationReceivedForeground,
      registerNotificationReceivedBackground,
      registerNotificationOpened,
    };
  };

  const handleRegister = async (event: Registered) => {
    return request({
      url: "/user/devices/token",
      method: "POST",
      body: { token: event.deviceToken, deviceId: getUniqueId() },
    });
  };

  const handleRegistrationFail = (event: RegistrationError) =>
    console.error(event);

  const handleIncomingForegroundNotification = (
    notification: Notification,
    completion: (response: NotificationCompletion) => void
  ) => {
    if (Platform.OS === "android") {
      // TODO maybe add types for this method and change 0 to a random integer? (not important)
      // @ts-ignore
      Notifications.postLocalNotification({ ...notification.payload }, 0);
    }
    completion({ alert: true, sound: true, badge: false });
  };

  const handleIncomingBackgroundNotification = (
    _: Notification,
    completion: (response: NotificationCompletion) => void
  ) => {
    completion({ alert: true, sound: true, badge: false });
  };

  const handleNotificationOpened = (
    notification: Notification | DeepLinkNotification,
    completion: () => void
  ) => {
    if ((notification as DeepLinkNotification).payload?.type) {
      const payload = (notification as DeepLinkNotification).payload;
      const type = (notification as DeepLinkNotification).payload.type;
      handleDeepLinkDispatch(type, payload);
    }
    completion();
  };

  const handleDeepLinkDispatch = (
    type: keyof typeof DeepLinkNotificationTypes,
    data: DeepLinkNotificationData
  ) => {
    switch (type) {
      case DeepLinkNotificationTypes.deeplink_new_follower: {
        const {
          username: followerUsername,
        } = data as DeepLinkNewFollowerNotificationData;
        setupDeepLinkOptions.toViewProfile.dispatch({
          username: followerUsername,
        });
        break;
      }
      case DeepLinkNotificationTypes.deeplink_new_livestream: {
        const { deviceId } = data as DeepLinkNewLiveStreamNotificationData;
        setupDeepLinkOptions.toViewLiveStream.dispatch({ deviceId });
        break;
      }
      case DeepLinkNotificationTypes.deeplink_new_post_interaction: {
        const { postId } = data as DeepLinkNewPostInteractionNotificationData;
        setupDeepLinkOptions.toViewPost.dispatch({ postId });
        break;
      }
      case DeepLinkNotificationTypes.deeplink_new_message_information: {
        const {
          conversationId,
        } = data as DeepLinkNewMessageInformationNotificationData;
        setupDeepLinkOptions.toViewConversation.dispatch({ conversationId });
        break;
      }
    }
  };

  const containsDeepLinkSubstring = (type: string) => type.includes("deeplink");

  return [handleSetup];
};

export default useNotifications;
