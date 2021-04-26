import React, { useEffect, useState, useContext, useRef } from "react";
import {
  Text,
  LoadingIndicator,
  Comment as CommentEl,
  Avatar,
  Divider,
  CommentsSlideUp,
  BlockUserSlideUp,
  ReportUserSlideUp,
} from "../../components";
import { HomeStackNavProps } from "../../navigation";
import { Comment } from "../../components/Posts/ImagePost";
import { useRequest, useSlideUp, useKeyboard } from "../../hooks";
import { ThemeContext } from "../../contexts";
import {
  ScrollView,
  RefreshControl,
  FlatList,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { bottomTabBarOffset, shadowBoxTop } from "../../constants";
import {
  PaginationState,
  defaultPaginationState,
  showBanner,
  scrollToEnd,
} from "../../utils";
import CommentInput from "../../components/Posts/CommentInput";
import { isIphoneX } from "../../constants/statusBar";

interface Props extends HomeStackNavProps<"ViewPostComments"> {}

interface State extends PaginationState {
  createdAt: string;
  comments: Comment[];
  commentCount: number;
}

const initialState: State = {
  ...defaultPaginationState,
  createdAt: "",
  comments: [],
  commentCount: 0,
};

export interface InitialFocusedCommentState {
  username: string;
  avatar: string;
  commentId: string;
}

const initialFocusedCommentState: InitialFocusedCommentState = {
  username: "",
  avatar: "",
  commentId: "",
};

const ViewPostComments = (props: Props) => {
  const [state, setState] = useState(initialState);
  const [focusedCommentState, setFocusedCommentState] = useState(
    initialFocusedCommentState
  );
  const { backgroundColor, textColor, borderColor } = useContext(ThemeContext);
  const scrollRef: any = useRef(null);
  const [request] = useRequest();
  const [keyboardShown, keyboardHeight] = useKeyboard();
  const [
    commentOptionsSlideUp,
    openCommentOptionsSlideUp,
    closeCommentOptionsSlideUp,
  ] = useSlideUp();
  const [
    reportUserRef,
    openReportUserSlideUp,
    closeReportUserSlideUp,
  ] = useSlideUp();
  const [
    blockUserRef,
    openBlockUserSlideUp,
    closeBlockUserSlideUp,
  ] = useSlideUp();

  props.navigation.setOptions({
    headerShown: true,
    title: "Comments",
    gestureEnabled: true,
  });

  useEffect(() => {
    (async () => {
      const response = await getComments({
        page: state.page,
        pageSize: state.pageSize,
      });
      if (response.ok) {
        setState({
          ...state,
          comments: response.data.comments,
          page: response.data.page + 1,
          reachedEnd: response.data.reachedEnd,
          initLoading: false,
        });
      } else setState({ ...state, initLoading: false });
    })();
  }, []);

  const getComments = async (params: { page: number; pageSize: number }) => {
    return request({
      url: "/user/posts/comments",
      method: "GET",
      params: { ...params, id: props.route.params.postId },
    });
  };

  const paginate = async () => {
    if (state.reachedEnd || state.paginationLoading) return;
    setState({ ...state, paginationLoading: true });
    const response = await getComments({
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState(({ comments }) => ({
        ...state,
        comments: [...comments, ...response.data.comments],
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        paginationLoading: false,
      }));
    } else {
      return setState({ ...state, paginationLoading: false });
    }
  };

  const refresh = async () => {
    setState({ ...state, refreshing: true });
    const response = await getComments({
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      setState({ ...response.data, refreshing: false });
    } else setState({ ...state, refreshing: false });
  };

  const ListEmptyComponent = () => {
    return state.initLoading ? (
      <LoadingIndicator style={{ marginTop: 40 }} />
    ) : (
      <Text a="center" w="bold" style={{ marginVertical: 20 }}>
        No comments yet!
      </Text>
    );
  };

  const ListFooterComponent = () => {
    if (state.paginationLoading) {
      return <LoadingIndicator style={{ marginTop: 40, marginBottom: 20 }} />;
    }
    if (!state.reachedEnd && !state.initLoading) {
      return (
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity onPress={paginate} style={{ paddingVertical: 20 }}>
            <Text a="center" t="highlight" w="bold">
              Load More
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  const onPressPostOwnerProfile = () => {
    props.navigation.push("UneditableProfile", {
      username: props.route.params.username,
    });
  };

  const onReportOrBlockSuccess = (username: string) => {
    const indexes: number[] = [];
    state.comments.forEach((c, index) => {
      if (c.username === username) {
        indexes.push(index);
      }
    });
    const commentsCopy = state.comments;
    indexes.forEach((i) => commentsCopy.splice(i, 1));
    setState({ ...state, comments: commentsCopy });
  };

  const onPressCommentOwner = (username: string) => {
    props.navigation.push("UneditableProfile", { username });
    closeCommentOptionsSlideUp();
  };

  const onLongPressComment = (
    focusedCommentState: InitialFocusedCommentState
  ) => {
    openCommentOptionsSlideUp();
    setFocusedCommentState(focusedCommentState);
  };

  const onFailReport = () => {
    showBanner({
      message: "An error occurred while reporting this user.",
      type: "danger",
    });
  };

  const onSubmitReport = () => {
    closeCommentOptionsSlideUp();
    closeReportUserSlideUp();
  };

  const submitCommentCallback = (comment: Comment) => {
    scrollToEnd(scrollRef);
    setState({ ...state, comments: [...state.comments, comment] });
  };

  const onDeleteCommentCallback = (commentId: string) => {
    const commentsCopy = state.comments;
    const commentData = findComment(commentId);
    if (commentData) {
      commentsCopy.splice(commentData.index, 1);
      setState((state) => ({ ...state, posts: commentsCopy }));
    } else {
      // TODO: error handle
    }
  };

  const findComment = (commentId: string) => {
    const index = state.comments.findIndex(({ id }) => id === commentId);
    if (index === -1) return;
    const post = state.comments[index];
    return { post, index };
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <ScrollView
        ref={scrollRef}
        refreshControl={
          <RefreshControl
            onRefresh={refresh}
            refreshing={state.refreshing}
            tintColor={textColor}
          />
        }
        contentContainerStyle={{
          paddingBottom: bottomTabBarOffset,
          paddingHorizontal: 20,
          paddingTop: 20,
        }}
      >
        <View>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity onPress={onPressPostOwnerProfile}>
              <Avatar
                avatar={props.route.params.avatar}
                style={{ width: 30, height: 30 }}
              />
            </TouchableOpacity>
            <View style={{ marginLeft: 10 }}>
              <TouchableOpacity onPress={() => {}}>
                <Text s="lg" w="bold">
                  {props.route.params.username}
                </Text>
              </TouchableOpacity>
              <View style={{ marginRight: 20 }}>
                <Text style={{ fontSize: 13 }}>
                  {props.route.params.description}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <Divider
          direction="horizontal"
          style={{ marginTop: 20, marginBottom: 15 }}
        />
        <FlatList
          showsVerticalScrollIndicator={false}
          data={state.comments}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          keyExtractor={(_, index: number) => index.toString()}
          ListHeaderComponent={
            state.comments.length > 0 ? (
              <Text t="muted" s="sm">
                Showing {state.comments.length} comments
              </Text>
            ) : (
              <></>
            )
          }
          ListEmptyComponent={ListEmptyComponent()}
          ListFooterComponent={ListFooterComponent()}
          renderItem={({ item, index }) => (
            <CommentEl
              {...item}
              showAvatar
              key={index}
              postId={props.route.params.postId}
              onPressProfile={onPressCommentOwner}
              onLongPressComment={onLongPressComment}
              onPressComment={onLongPressComment}
              numberOfLinesComment={5}
            />
          )}
        />
        <CommentsSlideUp
          ref={commentOptionsSlideUp}
          onPressViewProfile={onPressCommentOwner}
          openBlockUserSlideUp={openBlockUserSlideUp}
          openReportUserSlideUp={openReportUserSlideUp}
          onDeleteCommentCallback={onDeleteCommentCallback}
          closeCommentOptionsSlideUp={closeCommentOptionsSlideUp}
          {...focusedCommentState}
        />
        <ReportUserSlideUp
          ref={reportUserRef}
          onCancel={closeReportUserSlideUp}
          onSubmit={onSubmitReport}
          onFail={onFailReport}
          onSuccess={onReportOrBlockSuccess}
          username={focusedCommentState.username}
          reportData={{
            postId: props.route.params.postId,
            commentId: focusedCommentState.commentId,
            username: focusedCommentState.username,
          }}
          type="post-comment"
        />
        <BlockUserSlideUp
          ref={blockUserRef}
          onCancel={closeBlockUserSlideUp}
          onSuccess={onReportOrBlockSuccess}
          onSubmit={() => {
            closeBlockUserSlideUp();
            closeCommentOptionsSlideUp();
          }}
          username={focusedCommentState.username}
        />
      </ScrollView>
      <View
        style={{
          marginBottom: keyboardShown
            ? keyboardHeight + 20
            : isIphoneX()
            ? 30
            : 10,
          paddingHorizontal: 10,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor,
          ...shadowBoxTop,
        }}
      >
        <CommentInput
          postId={props.route.params.postId}
          submitCommentCallback={submitCommentCallback}
        />
      </View>
    </View>
  );
};

export default ViewPostComments;
