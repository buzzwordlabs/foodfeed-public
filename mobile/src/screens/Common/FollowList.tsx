import { FlatList, View, RefreshControl } from "react-native";
import { LoadingIndicator, ParentView, Text } from "../../components";
import {
  ProfileItem,
  ProfileItemUserInfo,
} from "../../components/Lists/ProfileItem";
import React, { useState, useEffect } from "react";
import { request } from "../../utils";

import { AccountStackNavProps } from "../../navigation";

type Props = AccountStackNavProps<"FollowList">;
interface State {
  followers: ProfileItemUserInfo[];
  page: number;
  reachedEnd: boolean;
  loading: boolean;
  refreshing: boolean;
  paginationLoading: boolean;
  pageSize: number;
}
const initialState: State = {
  followers: [],
  page: 1,
  reachedEnd: false,
  loading: false,
  refreshing: false,
  paginationLoading: false,
  pageSize: 15,
};

interface GetFollowersParams {
  username: string;
  page: number;
  pageSize: number;
}

const FollowList = (props: Props) => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    (async () => initialRequest())();
  }, []);

  props.navigation.setOptions({
    title: "Followers",
  });

  const getFollowers = async (params: GetFollowersParams) => {
    const { listType } = props.route.params;
    return request({
      url: `/user/followers/${
        listType === "followers" ? "other-followers" : "other-following"
      }`,
      method: "GET",
      params,
    });
  };

  const initialRequest = async () => {
    setState({ ...state, loading: true });
    const response = await getFollowers({
      username: props.route.params.username,
      page: 1,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState({
        ...state,
        followers: response.data.users,
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        loading: false,
      });
    } else setState({ ...state, loading: false });
  };

  const refresh = async () => {
    setState({ ...state, refreshing: true });
    const response = await getFollowers({
      username: props.route.params.username,
      page: 1,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState({
        ...state,
        followers: response.data.users,
        page: state.page + 1,
        reachedEnd: response.data.reachedEnd,
        refreshing: false,
      });
    } else setState({ ...state, refreshing: false });
  };

  const openProfile = (user: ProfileItemUserInfo) => {
    props.navigation.push("UneditableProfile", {
      username: user.username,
      // onBlockOrReportCallback: removeFollowerFromList,
    });
  };

  const removeFollowerFromList = (username: string) => {
    const followersCopy = state.followers;
    const removeIndex = followersCopy.findIndex(
      (follower) => follower.username === username
    );
    followersCopy.splice(removeIndex, 1);
    setState({ ...state, followers: followersCopy });
  };

  const paginate = async () => {
    const { username, listType } = props.route.params;
    if (state.reachedEnd || state.paginationLoading) return;
    setState({ ...state, paginationLoading: true });
    const response = await request({
      url: `/user/followers/${
        listType === "followers" ? "other-followers" : "other-following"
      }`,
      method: "GET",
      params: {
        username,
        page: state.page,
        pageSize: state.pageSize,
      },
    });
    if (response.ok) {
      return setState({
        ...state,
        followers: [...state.followers, ...response.data.users],
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        paginationLoading: false,
      });
    } else setState({ ...state, paginationLoading: false });
  };

  const { listType } = props.route.params;
  const {
    paginationLoading,
    reachedEnd,
    followers,
    loading,
    refreshing,
  } = state;
  return (
    <ParentView noScroll noHorizontalPadding safeBottomInset>
      <View>
        {loading ? (
          <LoadingIndicator />
        ) : (
          <FlatList
            style={{ paddingHorizontal: 12 }}
            data={followers}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            ListEmptyComponent={
              <Text a="center" w="bold" style={{ marginTop: 40 }}>
                No {listType === "followers" ? "followers" : "people"} could be
                found
              </Text>
            }
            keyExtractor={(item: any, index: number) => index.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} />
            }
            renderItem={({ item }) => (
              <ProfileItem {...item} onPress={openProfile} />
            )}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              reachedEnd ? (
                <Text a="center" w="bold" style={{ marginVertical: 20 }}>
                  You've reached the 🔚
                </Text>
              ) : paginationLoading ? (
                <LoadingIndicator style={{ marginVertical: 20 }} />
              ) : null
            }
            onEndReached={paginate}
          />
        )}
      </View>
    </ParentView>
  );
};

export default FollowList;
