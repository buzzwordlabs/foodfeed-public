import React, { useState, useContext, useEffect } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import {
  shadowBox,
  defaultHorizontalInset,
  bottomTabBarOffset,
} from "../../../../constants";
import { Avatar, Text, LoadingIndicator } from "../../../../components";
import {
  formatSecondsDuration,
  formatPGDate,
  PaginationState,
  defaultPaginationState,
} from "../../../../utils";
import { ThemeContext } from "../../../../contexts";
import { useRequest } from "../../../../hooks";

type CallHistoryItem = {
  createdAt: string;
  duration: number;
  username: string;
  avatar: string;
};

interface State extends PaginationState {
  callHistory: CallHistoryItem[];
}

const initialState: State = {
  ...defaultPaginationState,
  callHistory: [],
};

type Props = {
  username: string;
  parentRefreshing: boolean;
  onPressCallHistoryItem: (username: string) => void;
};

const CallHistory = (props: Props) => {
  const [state, setState] = useState(initialState);
  const [request] = useRequest();

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
    const response = await getCallHistory({
      page: 1,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState({
        ...state,
        callHistory: response.data.callHistory,
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        initLoading: false,
      });
    } else {
      return setState({ ...state, initLoading: false });
    }
  };

  const getCallHistory = async (params: { page: number; pageSize: number }) => {
    const response = await request({
      url: `/user/search/callHistory/${props.username}`,
      method: "GET",
      params,
    });
    return response;
  };

  const paginate = async () => {
    if (state.reachedEnd || state.paginationLoading) return;
    setState({ ...state, paginationLoading: true });
    const response = await getCallHistory({
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState(({ callHistory }) => ({
        ...state,
        callHistory: [...callHistory, ...response.data.callHistory],
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
        No call history yet.
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
    if (state.reachedEnd && state.callHistory.length > 0) {
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
      data={state.callHistory}
      ListEmptyComponent={ListEmptyComponent()}
      ListFooterComponent={ListFooterComponent()}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      keyExtractor={(item: any, index: number) => index.toString()}
      renderItem={({ item }: { item: CallHistoryItem }) => (
        <CallHistoryItemEl
          {...item}
          onPressCallHistoryItem={props.onPressCallHistoryItem}
        />
      )}
    />
  );
};

interface CallHistoryItemProps extends CallHistoryItem {
  onPressCallHistoryItem: (username: string) => void;
}

const CallHistoryItemEl = (props: CallHistoryItemProps) => {
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
      onPress={() => props.onPressCallHistoryItem(props.username)}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignSelf: "flex-start",
          marginBottom: 10,
        }}
      >
        <Avatar avatar={props.avatar} style={{ width: 30, height: 30 }} />
        <View style={{ alignSelf: "center", marginLeft: 10 }}>
          <Text s="lg" w="bold">
            {props.username}
          </Text>
        </View>
      </View>
      <Text>{formatSecondsDuration(props.duration)}</Text>
      <Text style={{ marginBottom: 10 }}>{formatPGDate(props.createdAt)}</Text>
    </TouchableOpacity>
  );
};

export default CallHistory;
