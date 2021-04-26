import React, { useContext, useState, useEffect } from "react";
import { ActivityStackNavProps } from "../../navigation/Stacks/Private/ActivityStack/ActivityStackProps";
import { Text, Avatar, LoadingIndicator } from "../../components";
import {
  View,
  Keyboard,
  RefreshControl,
  FlatList,
  StyleSheet,
} from "react-native";
import { ThemeContext } from "../../contexts";
import {
  shadowBox,
  bottomTabBarOffset,
  statusBarHeight,
  tintColor,
  fadedTintColor,
} from "../../constants";
import FastImage from "react-native-fast-image";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  formatMessageDate,
  PostReactionStringOptions,
  PaginationState,
  defaultPaginationState,
  PostReactionsStringIndexed,
} from "../../utils";
import { useRequest } from "../../hooks";
import { BadgeContext } from "../../contexts/BadgeContext";
import { useScrollToTop } from "@react-navigation/native";

interface Props extends ActivityStackNavProps<"Activity"> {}

interface State extends PaginationState {
  activities: ActivityItemData[];
}

const initialState: State = {
  ...defaultPaginationState,
  activities: [],
};
type ActivityItemTypes = "new-follower" | "post-reaction" | "post-comment";
type ActivityItemTypesObj = {
  type: ActivityItemTypes;
  id: string;
  viewed: boolean;
  createdAt: string;
  username: string;
  avatar: string;
};

interface FollowerActivity extends ActivityItemTypesObj {
  type: "new-follower";
}

interface ActivityMedia {
  id: string;
  postId: string;
  type: "image"; // Hardcoded, no videos yet
  position: number;
  uri: string;
}

interface PostCommentActivity extends ActivityItemTypesObj {
  type: "post-comment";
  postId: string;
  comment: string;
  media: ActivityMedia;
}

interface PostReactionActivity extends ActivityItemTypesObj {
  type: "post-reaction";
  postId: string;
  reaction: PostReactionStringOptions;
  media: ActivityMedia;
}

type ActivityItemData = (
  | FollowerActivity
  | PostCommentActivity
  | PostReactionActivity
) & { type: ActivityItemTypes };

const Activity = (props: Props) => {
  const { textColor, backgroundColor } = useContext(ThemeContext);
  const { badgeStatusState, setBadgeStatusState } = useContext(BadgeContext);
  const [state, setState] = useState(initialState);
  const [request] = useRequest();
  const ref = React.useRef(null);
  useScrollToTop(ref);

  useEffect(() => {
    (async () => initLoad())();
    setBadgeStatusState({ ...badgeStatusState, activity: 0 });
  }, []);

  const initLoad = async () => {
    const response = await getActivity({
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState({
        ...state,
        page: response.data.page + 1,
        activities: response.data.activities,
        reachedEnd: response.data.reachedEnd,
        initLoading: false,
      });
    } else {
      return setState({ ...state, initLoading: false });
    }
  };

  const onPressUsername = (username: string) => {
    props.navigation.push("UneditableProfile", { username });
  };

  const onPressPost = (postId: string) => {
    props.navigation.push("ViewPost", {
      postId,
      onDeletePostCallback: () => {},
    });
  };

  const getActivity = async (params: { pageSize: number; page: number }) => {
    return request({
      url: "/user/activities",
      method: "GET",
      params,
    });
  };

  const paginate = async () => {
    if (state.reachedEnd || state.paginationLoading) return;
    setState((prevState) => ({ ...prevState, paginationLoading: true }));
    const response = await getActivity({
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState(({ activities, ...prevState }) => ({
        ...prevState,
        activities: [...activities, ...response.data.activities],
        reachedEnd: response.data.reachedEnd,
        page: response.data.page + 1,
        paginationLoading: false,
      }));
    } else {
      return setState(({ ...prevState }) => ({
        ...prevState,
        paginationLoading: false,
      }));
    }
  };
  const refresh = async () => {
    setBadgeStatusState({ ...badgeStatusState, activity: 0 });
    setState((state) => ({ ...state, refreshing: true }));
    const response = await getActivity({ page: 1, pageSize: state.pageSize });
    if (response.ok) {
      setState((state) => ({
        ...state,
        page: response.data.page + 1,
        activities: response.data.activities,
        reachedEnd: response.data.reachedEnd,
        refreshing: false,
      }));
    } else {
      setState({ ...state, refreshing: false });
    }
  };

  const ListEmptyComponent = () => {
    return state.initLoading ? (
      <LoadingIndicator style={{ marginTop: 40 }} />
    ) : (
      <Text a="center" w="bold" style={{ marginVertical: 20 }}>
        No activity yet!
      </Text>
    );
  };

  const ListFooterComponent = () => {
    if (state.paginationLoading) {
      return (
        <LoadingIndicator
          style={{ marginTop: 20, marginBottom: bottomTabBarOffset + 50 }}
        />
      );
    }
    if (state.reachedEnd && state.activities.length > state.pageSize) {
      return (
        <Text
          a="center"
          w="bold"
          style={{ marginTop: 20, marginBottom: bottomTabBarOffset + 50 }}
        >
          You've reached the 🔚
        </Text>
      );
    }
  };

  const RefreshControlComponent = () => (
    <RefreshControl
      refreshing={state.refreshing}
      onRefresh={refresh}
      tintColor={textColor}
    />
  );

  return (
    <View style={{ backgroundColor, paddingTop: statusBarHeight, flex: 1 }}>
      <View
        style={{
          marginBottom: 10,
          paddingHorizontal: 20,
          flexDirection: "row",
        }}
      >
        <Text s="header" w="bold">
          Activity
        </Text>
      </View>
      <FlatList
        ref={ref}
        style={{ paddingHorizontal: 10 }}
        onScrollBeginDrag={Keyboard.dismiss}
        data={state.activities}
        keyExtractor={(_item: any, index: number) => index.toString()}
        onEndReachedThreshold={0.01}
        ListEmptyComponent={ListEmptyComponent()}
        refreshControl={RefreshControlComponent()}
        ListFooterComponent={ListFooterComponent()}
        onEndReached={paginate}
        renderItem={({ item, index }) => {
          return (
            <>
              {index === 0 && !item.viewed && (
                <Text w="bold" style={{ marginLeft: 10 }}>
                  New
                </Text>
              )}
              <ActivityItem
                {...item}
                onPressPost={onPressPost}
                onPressUsername={onPressUsername}
              />
            </>
          );
        }}
      />
    </View>
  );
};

type ActivityItemProps = ActivityItemData & {
  onPressUsername: (username: string) => void;
  onPressPost: (postId: string) => void;
};

const ActivityItem = (props: ActivityItemProps) => {
  const { liftedBackgroundColor } = useContext(ThemeContext);
  if (!props.type) return <></>;
  const resolveBaseData = (type: ActivityItemTypes) => {
    const humanizedDate = formatMessageDate(props.createdAt);
    const resolvedData = {
      type,
      id: props.id,
      viewed: props.viewed,
      createdAt: props.createdAt,
      username: props.username,
      avatar: props.avatar,
      humanizedDate,
    };
    switch (type) {
      case "new-follower": {
        return {
          ...resolvedData,
          text: () => (
            <>
              <Text onPress={() => props.onPressUsername(props.username)}>
                <Text w="bold">{props.username}</Text>
                <Text> followed you</Text>
              </Text>
            </>
          ),
        };
      }
      case "post-reaction": {
        const { postId, reaction, media } = props as PostReactionActivity;
        const reactionEmoji = PostReactionsStringIndexed[reaction];
        return {
          ...resolvedData,
          postId,
          reaction,
          media,
          text: () => (
            <>
              <Text onPress={() => props.onPressPost(postId)}>
                <Text w="bold">{props.username}</Text>
                <Text>
                  {" "}
                  {reaction === "like"
                    ? "liked your post"
                    : `reacted to your post with ${reactionEmoji}`}
                </Text>
              </Text>
            </>
          ),
        };
      }
      case "post-comment": {
        const { postId, comment, media } = props as PostCommentActivity;
        return {
          ...resolvedData,
          postId,
          comment,
          media,
          text: () => (
            <>
              <Text onPress={() => props.onPressPost(postId)}>
                <Text w="bold">{props.username}</Text>
                <Text> commented on your post: {"\n"}</Text>
                <Text w="semiBold">
                  "{comment.split(" ").slice(0, 10).join(" ")}
                  {comment.split(" ").length > 10 && "..."}"
                </Text>
              </Text>
            </>
          ),
        };
      }
    }
  };

  const resolvedData = resolveBaseData(props.type);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        paddingVertical: 15,
        borderRadius: 10,
        backgroundColor: liftedBackgroundColor,
        marginTop: 10,
        borderWidth: resolvedData.viewed ? 0 : 1,
        borderColor: `${tintColor}66`,
        ...shadowBox,
      }}
    >
      <TouchableOpacity
        style={{ paddingHorizontal: 10 }}
        onPress={() => props.onPressUsername(resolvedData.username)}
      >
        <Avatar
          style={{ width: 35, height: 35 }}
          avatar={resolvedData.avatar}
        />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        {resolvedData.text()}
        {resolvedData.humanizedDate ? (
          <Text s="xs" t="muted" style={{ marginTop: 15 }}>
            {resolvedData.humanizedDate}
          </Text>
        ) : null}
      </View>
      {["post-comment", "post-reaction"].includes(resolvedData.type) &&
        (resolvedData as PostCommentActivity).postId && (
          <TouchableOpacity
            style={{ paddingHorizontal: 10 }}
            onPress={() =>
              props.onPressPost((resolvedData as PostCommentActivity).postId)
            }
          >
            {(resolvedData as PostCommentActivity).media && (
              <FastImage
                source={{
                  uri: (resolvedData as PostCommentActivity).media.uri,
                }}
                style={{ width: 50, height: 50 }}
              />
            )}
          </TouchableOpacity>
        )}
    </View>
  );
};

export default Activity;
