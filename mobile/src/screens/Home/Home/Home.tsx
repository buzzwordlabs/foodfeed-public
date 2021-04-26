import {
  amplitude,
  generateAmplitudeLoggedInConfig,
  readCache,
  requestPermission,
  writeCache,
  checkPermission,
} from "../../../utils";
import {
  TouchableOpacity,
  View,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { GlobalContext, ThemeContext, StreamContext } from "../../../contexts";
import { Icon, Text, TabView } from "../../../components";
import React, { useContext, useEffect, ReactNode, useState } from "react";
import { statusBarHeight } from "../../../constants";

import ENV from "../../../../env";
import { HomeStackNavProps, ViewPostCommentsParams } from "../../../navigation";
import { useNotifications, useNavigationLock, useModal } from "../../../hooks";
import Posts from "./TabViews/Posts";
import LiveStreams from "./TabViews/LiveStreams";
import { PushToProfile, PushToStream } from "./types";

type Props = HomeStackNavProps<"Home">;

enum TabRouteTitles {
  "Live Streams" = "Live Streams",
  "Posts" = "Posts",
}

enum TabRouteKeys {
  live_streams = "live_streams",
  posts = "posts",
}

const tabOptionConfig: {
  key: keyof typeof TabRouteKeys;
  title: keyof typeof TabRouteTitles;
}[] = [
  { key: TabRouteKeys.posts, title: TabRouteTitles["Posts"] },
  { key: TabRouteKeys.live_streams, title: TabRouteTitles["Live Streams"] },
];

const Home = (props: Props) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [routes] = useState(tabOptionConfig);
  const global = useContext(GlobalContext);
  const { backgroundColor } = useContext(ThemeContext);
  const [locker] = useNavigationLock();
  const streamContext = useContext(StreamContext);
  const [handleSetup] = useNotifications();

  const { openModal, closeModal } = useModal();

  useEffect(() => {
    if (props.route.params?.deepLinkScreen) {
      const { deviceId, postId, username, conversationId } = props.route.params;
      const screen = props.route.params?.deepLinkScreen;
      switch (screen) {
        case "ViewLiveStream":
          if (deviceId) pushToStream({ deviceId, removeStream: () => {} });
          break;
        case "ViewPost":
          if (postId)
            props.navigation.push("ViewPost", {
              postId,
              onDeletePostCallback: () => {},
            });
          break;
        case "UneditableProfile":
          if (username)
            props.navigation.push("UneditableProfile", { username });
          break;
        case "Conversations":
          if (conversationId) {
            // @ts-ignore
            props.navigation.navigate("ConversationsStack", {
              screen: "Conversations",
              params: { conversationId, deepLinkScreen: "Conversation" },
            });
          }
      }
    }
  }, [props.route.params]);

  useEffect(() => {
    (async () => {
      let notificationsStatus = await checkPermission("notifications");
      if (notificationsStatus === "denied") {
        const askedInitialRequestPermissions = await readCache(
          "askedInitialRequestPermissions"
        );
        if (!askedInitialRequestPermissions) {
          await writeCache("askedInitialRequestPermissions", true);
          openModal("GenericModal", {
            title: "Notifications",
            description:
              "Mind if we give you a nudge when something cool happens? 🥺 \n\n You'll get notifications for things like new followers, likes, comments.",
            options: [
              {
                title: "Sure! 👍",
                onPress: async () => {
                  notificationsStatus = await requestPermission(
                    "notifications"
                  );
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
        }
      }
    })();
    const userId = global.state.userId;
    if (userId) {
      amplitude.init(
        ENV.AMPLITUDE_API_KEY,
        userId,
        generateAmplitudeLoggedInConfig(userId)
      );
    }
  }, []);

  const pushToStream: PushToStream = ({ deviceId, index, removeStream }) => {
    streamContext.joinStream(deviceId);
    locker() &&
      props.navigation.push("ViewLiveStream", {
        deviceId,
        // If there is no index associated with this live stream, you can't remove it
        removeStream: index === undefined ? () => {} : removeStream,
      });
  };

  const pushToProfile: PushToProfile = (username) => {
    props.navigation.push("UneditableProfile", { username });
  };

  const pushToSearch = () => props.navigation.push("Search");

  const pushToComments = ({
    postId,
    avatar,
    username,
    description,
  }: ViewPostCommentsParams) => {
    props.navigation.push("ViewPostComments", {
      postId,
      avatar,
      username,
      description,
    });
  };

  const renderScene = ({
    route,
  }: {
    route: { key: keyof typeof TabRouteKeys };
  }): ReactNode => {
    switch (route.key) {
      case "live_streams":
        return (
          <LiveStreams
            pushToProfile={pushToProfile}
            pushToStream={pushToStream}
          />
        );
      case "posts":
        return (
          <Posts
            pushToProfile={pushToProfile}
            pushToComments={pushToComments}
          />
        );
      default:
        return <></>;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={10}
    >
      <View
        style={{
          flex: 1,
          backgroundColor,
          paddingTop: Platform.OS === "ios" ? statusBarHeight : 0,
        }}
      >
        <View>
          <View
            style={{
              paddingLeft: 20,
              paddingRight: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text s="header" w="bold">
                Home
              </Text>
            </View>
            <TouchableOpacity
              style={{ padding: 7.5, paddingBottom: 0 }}
              onPress={pushToSearch}
            >
              <Icon name="search1" library="antdesign" size={24} />
            </TouchableOpacity>
          </View>
        </View>
        <TabView
          navigationState={{ index: tabIndex, routes }}
          renderScene={renderScene}
          onIndexChange={setTabIndex}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default Home;
