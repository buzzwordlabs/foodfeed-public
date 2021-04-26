import React, { useState, useContext, useEffect, useRef } from "react";
import { FlatList, TouchableOpacity, View, Platform } from "react-native";
import {
  shadowBox,
  successColor,
  errorColor,
  defaultHorizontalInset,
  bottomTabBarOffset,
} from "../../../../constants";
import {
  formatSecondsDuration,
  formatPGDate,
  PaginationState,
  defaultPaginationState,
  amplitudeTrack,
  AMPLITUDE_MISCELLANEOUS_EVENTS,
  prettyTimeMS,
} from "../../../../utils";
import { Icon, Text, LoadingIndicator } from "../../../../components";
import { ThemeContext } from "../../../../contexts";
import { useRequest, useNavigationLock } from "../../../../hooks";
import FastImage from "react-native-fast-image";

interface StreamHistoryItem {
  title: string;
  duration: number;
  upvote: number;
  downvote: number;
  createdAt: string;
  thumbnail: string;
}

interface State extends PaginationState {
  streamHistory: StreamHistoryItem[];
}

const initialState: State = {
  ...defaultPaginationState,
  streamHistory: [],
};

type Props = { username: string; parentRefreshing: boolean };

const StreamHistory = (props: Props) => {
  const [state, setState] = useState(initialState);
  const { liftedBackgroundColor } = useContext(ThemeContext);
  const [request] = useRequest();
  const [] = useNavigationLock();

  useEffect(() => {
    (async () => {
      if (props.parentRefreshing) {
        await initLoad();
      }
    })();
  }, [props.parentRefreshing]);

  useEffect(() => {
    (async () => initLoad())();
  }, []);

  const initLoad = async () => {
    const response = await getStreamHistory({
      page: 1,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState({
        ...state,
        streamHistory: response.data.streamHistory,
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        initLoading: false,
      });
    } else {
      return setState({ ...state, initLoading: false });
    }
  };

  const getStreamHistory = async (params: {
    page: number;
    pageSize: number;
  }) => {
    return request({
      url: `user/search/streamHistory/${props.username}`,
      method: "GET",
      params,
    });
  };

  const paginate = async () => {
    if (state.reachedEnd || state.paginationLoading) return;
    setState({ ...state, paginationLoading: true });
    const response = await getStreamHistory({
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState(({ streamHistory }) => ({
        ...state,
        streamHistory: [...streamHistory, ...response.data.streamHistory],
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        paginationLoading: false,
      }));
    } else {
      return setState({ ...state, paginationLoading: false });
    }
  };
  const ListEmptyComponent = () => {
    return state.initLoading ? (
      <LoadingIndicator style={{ marginTop: 40 }} />
    ) : (
      <Text style={{ marginTop: 20 }} a="center" w="bold">
        No streams yet.
      </Text>
    );
  };

  const ListFooterComponent = () => {
    if (state.paginationLoading) {
      return (
        <LoadingIndicator
          style={{ marginTop: 20, marginBottom: bottomTabBarOffset }}
        />
      );
    }
    if (state.reachedEnd && state.streamHistory.length > 0) {
      return (
        <Text
          a="center"
          w="bold"
          style={{ marginTop: 20, marginBottom: bottomTabBarOffset + 20 }}
        >
          You've reached the 🔚
        </Text>
      );
    }
    if (!state.reachedEnd && !state.initLoading) {
      return (
        <View style={{ marginBottom: bottomTabBarOffset }}>
          <TouchableOpacity onPress={paginate} style={{ paddingVertical: 20 }}>
            <Text a="center" t="highlight" w="bold">
              Load More
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <FlatList
      style={{ paddingHorizontal: defaultHorizontalInset }}
      data={state.streamHistory}
      ListEmptyComponent={ListEmptyComponent()}
      ListFooterComponent={ListFooterComponent()}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      keyExtractor={(item: any, index: number) => index.toString()}
      renderItem={({ item }: { item: StreamHistoryItem }) => (
        <StreamHistoryItemEl {...item} />
      )}
    />
  );
};

interface StreamHistoryItemProps extends StreamHistoryItem {}

const StreamHistoryItemEl = (props: StreamHistoryItemProps) => {
  const { liftedBackgroundColor } = useContext(ThemeContext);
  return (
    <TouchableOpacity
      style={{
        flex: 1,
        padding: 15,
        borderRadius: 10,
        backgroundColor: liftedBackgroundColor,
        ...shadowBox,
        marginTop: 10,
      }}
      onPress={() =>
        amplitudeTrack(
          AMPLITUDE_MISCELLANEOUS_EVENTS.pressed_stream_history_item
        )
      }
    >
      <View style={{ marginBottom: 20 }}>
        <FastImage
          resizeMode="cover"
          style={{ width: "100%", height: 200 }}
          source={{ uri: props.thumbnail || "" }}
        />
      </View>
      <Text w="bold" s="lg" style={{ marginBottom: 10 }}>
        {props.title}
      </Text>
      <Text>{prettyTimeMS(props.duration).textFormat}</Text>
      <Text style={{ marginBottom: 10 }}>{formatPGDate(props.createdAt)}</Text>
      <View
        style={{
          flexDirection: "row",
          alignSelf: "flex-start",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignSelf: "flex-start",
            alignItems: "center",
            marginRight: 10,
          }}
        >
          <Icon
            library="antdesign"
            name="like2"
            color={successColor}
            size={20}
            style={{ marginRight: 5 }}
          />
          <View>
            <Text>{props.upvote}</Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            marginRight: 10,
            alignItems: "center",
            alignSelf: "flex-start",
          }}
        >
          <Icon
            library="antdesign"
            name="dislike2"
            color={errorColor}
            size={20}
            style={{ marginRight: 5 }}
          />
          <View>
            <Text>{props.downvote}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default StreamHistory;
