import { PaginationState, defaultPaginationState } from "../../../../utils";
import { Post } from "../../../../components/Posts/ImagePost";
import { Text, PostThumbnail, LoadingIndicator } from "../../../../components";
import { window, bottomTabBarOffset } from "../../../../constants";
import React, { useState, useEffect } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { useRequest } from "../../../../hooks";

interface State extends PaginationState {
  postHistory: Post[];
}

interface Props {
  parentRefreshing: boolean;
  username: string;
  onPressPost: (
    postId: string,
    onDeletePostCallback: (postId: string) => void
  ) => void;
}

const initialState: State = {
  ...defaultPaginationState,
  postHistory: [],
};

const PostHistory = (props: Props) => {
  const [state, setState] = useState(initialState);
  const [request] = useRequest();

  useEffect(() => {
    (async () => initLoad())();
  }, []);

  useEffect(() => {
    (async () => {
      if (props.parentRefreshing) {
        await initLoad();
      }
    })();
  }, [props.parentRefreshing]);

  const initLoad = async () => {
    const response = await getPostHistory({
      page: 1,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState({
        ...state,
        postHistory: response.data.postHistory,
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        initLoading: false,
      });
    } else {
      return setState({ ...state, initLoading: false });
    }
  };

  const getPostHistory = async (params: { page: number; pageSize: number }) => {
    return request({
      url: `user/search/postHistory/${props.username}`,
      method: "GET",
      params,
    });
  };

  const paginate = async () => {
    if (state.reachedEnd || state.paginationLoading) return;
    setState({ ...state, paginationLoading: true });
    const response = await getPostHistory({
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState(({ postHistory }) => ({
        ...state,
        postHistory: [...postHistory, ...response.data.postHistory],
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        paginationLoading: false,
      }));
    } else {
      return setState({ ...state, paginationLoading: false });
    }
  };

  const onDeletePostCallback = (postId: string) => {
    const postHistoryCopy = state.postHistory;
    const postHistoryData = findPost(postId);
    if (postHistoryData) {
      postHistoryCopy.splice(postHistoryData.index, 1);
      setState((state) => ({ ...state, postHistory: postHistoryCopy }));
    } else {
      // TODO: error handle
    }
  };

  const findPost = (postId: string) => {
    const index = state.postHistory.findIndex(({ id }) => id === postId);
    if (index === -1) return;
    const post = state.postHistory[index];
    return { post, index };
  };

  const ListEmptyComponent = () => {
    return state.initLoading ? (
      <LoadingIndicator style={{ marginTop: 40 }} />
    ) : (
      <Text style={{ marginTop: 20 }} a="center" w="bold">
        No posts yet.
      </Text>
    );
  };

  const ListFooterComponent = () => {
    if (state.paginationLoading) {
      return (
        <LoadingIndicator
          style={{ marginTop: 40, marginBottom: bottomTabBarOffset }}
        />
      );
    }
    if (state.reachedEnd && state.postHistory.length > 0) {
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

  const NUM_COLUMNS = 2;
  const THUMBNAIL_SIZE = window.width / NUM_COLUMNS - 1;
  return (
    <FlatList
      numColumns={NUM_COLUMNS}
      data={state.postHistory}
      ListEmptyComponent={ListEmptyComponent()}
      ListFooterComponent={ListFooterComponent()}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      keyExtractor={(_, index: number) => index.toString()}
      renderItem={({ item }: { item: Post }) => (
        <PostThumbnail
          width={THUMBNAIL_SIZE}
          height={THUMBNAIL_SIZE}
          onPress={props.onPressPost}
          onDeletePostCallback={onDeletePostCallback}
          {...item}
        />
      )}
    />
  );
};
export default PostHistory;
