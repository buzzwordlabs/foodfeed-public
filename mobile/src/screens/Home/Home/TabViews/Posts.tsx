import React, { useEffect, useState, useContext } from "react";
import { ThemeContext } from "../../../../contexts";
import { PaginationState, defaultPaginationState } from "../../../../utils";
import { bottomTabBarOffset } from "../../../../constants";
import { useRequest } from "../../../../hooks";
import { FlatList } from "react-native-gesture-handler";
import {
  ImagePost,
  Text,
  LoadingIndicator,
  PostAd,
} from "../../../../components";
import { Post, Comment } from "../../../../components/Posts/ImagePost";
import { RefreshControl, Keyboard } from "react-native";
import { PushToProfile, OnFinishEdit } from "../types";
import {
  PostReactionStringOptions,
  PostReaction,
} from "../../../../utils/emoji";
import { ViewPostCommentsParams } from "../../../../navigation";
import { useScrollToTop } from "@react-navigation/native";

interface State extends PaginationState {
  posts: Post[];
}

const initialState: State = {
  ...defaultPaginationState,
  posts: [],
};

interface Props {
  pushToProfile: PushToProfile;
  pushToComments: (args: ViewPostCommentsParams) => void;
}

const Posts = (props: Props) => {
  const { textColor } = useContext(ThemeContext);
  const [state, setState] = useState(initialState);
  const [request] = useRequest();
  const ref = React.useRef(null);
  useScrollToTop(ref);

  useEffect(() => {
    (async () => initLoad())();
  }, []);

  const initLoad = async () => {
    const response = await getPosts({
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState({
        ...state,
        page: response.data.page + 1,
        posts: copyReactionsInPostsArray(response.data.posts),
        reachedEnd: response.data.reachedEnd,
        initLoading: false,
      });
    } else {
      return setState({ ...state, initLoading: false });
    }
  };

  const copyReactionsInPostsArray = (
    posts: Post[]
  ): (Post & { originalReactions: PostReaction[] })[] => {
    return posts.map((post) => {
      return {
        ...post,
        originalReactions: post.reactions,
      };
    });
  };

  const getPosts = async (params: { page: number; pageSize: number }) => {
    return request({
      url: "/user/posts",
      method: "GET",
      params,
    });
  };

  const paginate = async () => {
    if (state.reachedEnd || state.paginationLoading) return;
    setState({ ...state, paginationLoading: true });
    const response = await getPosts({
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState(({ posts }) => ({
        ...state,
        posts: [...posts, ...copyReactionsInPostsArray(response.data.posts)],
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        paginationLoading: false,
      }));
    } else {
      return setState({ ...state, paginationLoading: false });
    }
  };

  const refresh = async () => {
    setState((state) => ({ ...state, refreshing: true }));
    const response = await getPosts({ page: 1, pageSize: state.pageSize });
    if (response.ok) {
      setState((state) => ({
        ...state,
        page: response.data.page + 1,
        posts: copyReactionsInPostsArray(response.data.posts),
        reachedEnd: response.data.reachedEnd,
        refreshing: false,
      }));
    } else {
      setState({ ...state, refreshing: false });
    }
  };

  const onToggleFollowCallback = ({
    username,
    wasFollowing,
  }: {
    username: string;
    wasFollowing: boolean;
  }) => {
    const indexes = findPostIndexesPostedByUser(username);

    const postsCopy = state.posts;
    indexes.forEach((index) => {
      postsCopy[index].isFollowing = !wasFollowing;
    });
    setState({ ...state, posts: postsCopy });
  };

  const onDeletePostCallback = (postId: string) => {
    const postsCopy = state.posts;
    const postData = findPost(postId);
    if (postData) {
      postsCopy.splice(postData.index, 1);
      setState((state) => ({ ...state, posts: postsCopy }));
    } else {
      // TODO: error handle
    }
  };

  const findPost = (postId: string) => {
    const index = state.posts.findIndex(({ id }) => id === postId);
    if (index === -1) return;
    const post = state.posts[index];
    return { post, index };
  };

  const findPostIndexesPostedByUser = (username: string) => {
    let indexes: number[] = [];
    state.posts.forEach((post, index) => {
      post.username === username && indexes.push(index);
    });
    return indexes;
  };

  const onToggleLikePostCallback = (
    postId: string,
    currentlyLiked: boolean
  ) => {
    const postsCopy = state.posts;
    const postData = findPost(postId);
    if (!postData) return;
    else {
      const { index: postIndex } = postData;
      const post = postsCopy[postIndex];
      const reactionData = findReactionObject("like", post.reactions);
      if (!reactionData) return;
      const { index: reactionIndex } = reactionData;
      const originalReactionData = findReactionObject(
        "like",
        post.originalReactions
      );
      if (reactionIndex > -1) {
        post.reactions[reactionIndex].reacted = !post.reactions[reactionIndex]
          .reacted;
        if (originalReactionData) {
          if (originalReactionData.postReaction.reacted) {
            post.reactions[reactionIndex].count = currentlyLiked
              ? originalReactionData.postReaction.count
              : originalReactionData.postReaction.count + 1;
          } else {
            post.reactions[reactionIndex].count = currentlyLiked
              ? originalReactionData.postReaction.count - 1
              : originalReactionData.postReaction.count;
          }
          post.reactions.splice(
            reactionIndex,
            1,
            post.reactions[reactionIndex]
          );
          postsCopy.splice(postIndex, 1, post);
        } else {
          post.reactions[reactionIndex].count = 1;
        }

        setState((state) => ({ ...state, posts: postsCopy }));
      }
    }
  };

  const findReactionObject = (
    reactionString: PostReactionStringOptions,
    postReactions: PostReaction[]
  ) => {
    const index = postReactions.findIndex(
      ({ reaction }) => reaction === reactionString
    );
    if (index === -1) return;
    const postReaction = postReactions[index];
    return { postReaction, index };
  };

  const onFinishEditOverride: OnFinishEdit = ({ postId, newDescription }) => {
    const postsCopy = state.posts;
    const postData = findPost(postId);
    if (!postData) return;
    else {
      const { index } = postData;
      postsCopy[index].description = newDescription;
      setState((state) => ({ ...state, posts: postsCopy }));
    }
  };

  const submitCommentCallback = (comment: Comment) => {
    const postId = comment.postId;
    const postData = findPost(postId);
    if (postData) {
      const postsCopy = state.posts;
      const { post, index } = postData;
      post.comments = [...post.comments, comment];
      postsCopy.splice(index, 1, post);
      setState({ ...state, posts: postsCopy });
    }
  };

  const ListEmptyComponent = () => {
    return state.initLoading ? (
      <LoadingIndicator style={{ marginTop: 40 }} />
    ) : (
      <Text a="center" w="bold" style={{ marginVertical: 20 }}>
        No posts yet!
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
    if (state.reachedEnd && state.posts.length > 0) {
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

  const onPressReactionCallback = (
    newReactions: PostReaction[],
    postIndex: number
  ) => {
    const postsCopy = state.posts;
    const post = postsCopy[postIndex];
    post.reactions = newReactions;
    postsCopy.splice(postIndex, 1, post);
    setState({ ...state, posts: postsCopy });
  };

  return (
    <FlatList
      ref={ref}
      onScrollBeginDrag={Keyboard.dismiss}
      showsVerticalScrollIndicator={false}
      data={state.posts}
      initialNumToRender={3}
      maxToRenderPerBatch={5}
      keyExtractor={(_item: any, index: number) => index.toString()}
      onEndReachedThreshold={0.4}
      refreshControl={RefreshControlComponent()}
      ListEmptyComponent={ListEmptyComponent()}
      ListFooterComponent={ListFooterComponent()}
      onEndReached={paginate}
      renderItem={({ item, index }) => (
        <>
          {index % 10 === 0 && index > 0 && <PostAd />}
          <ImagePost
            {...item}
            postIndex={index}
            onPressReactionCallback={onPressReactionCallback}
            onDeletePostCallback={onDeletePostCallback}
            onBlockPostCallback={onDeletePostCallback}
            onReportPostCallback={onDeletePostCallback}
            onToggleLikePostCallback={onToggleLikePostCallback}
            onViewProfile={props.pushToProfile}
            onFinishEdit={onFinishEditOverride}
            onToggleFollowCallback={onToggleFollowCallback}
            onPressComment={props.pushToComments}
            submitCommentCallback={submitCommentCallback}
          />
        </>
      )}
    />
  );
};

export default Posts;
