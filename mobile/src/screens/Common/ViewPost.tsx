import React, { useEffect, useState, useContext } from "react";
import { ImagePost } from "../../components";
import { HomeStackNavProps } from "../../navigation";
import { Post, Comment } from "../../components/Posts/ImagePost";
import { useRequest, useKeyboard } from "../../hooks";
import { ThemeContext, GlobalContext } from "../../contexts";
import { ScrollView, View, RefreshControl, StyleSheet } from "react-native";
import { bottomTabBarOffset, shadowBoxTop } from "../../constants";
import {
  PlaceholderContainer,
  PlaceholderMedia,
  PlaceholderLine,
} from "../../components/Placeholder";
import { OnFinishEdit, PushToComments } from "../Home/Home/types";
import { PostReaction, findReactionObjectFromArray } from "../../utils";
import CommentInput from "../../components/Posts/CommentInput";
import { isIphoneX } from "../../constants/statusBar";

interface Props extends HomeStackNavProps<"ViewPost"> {}

interface State extends Omit<Post, "id"> {
  loading: boolean;
  refreshingLoading: boolean;
}

const initialState: State = {
  description: "",
  reactions: [],
  originalReactions: [],
  media: [],
  edited: "",
  createdAt: "",
  avatar: "",
  username: "",
  comments: [],
  commentCount: 0,
  loading: true,
  isFollowing: true,
  refreshingLoading: false,
};

const ViewPost = (props: Props) => {
  const [state, setState] = useState(initialState);
  const { backgroundColor, borderColor } = useContext(ThemeContext);
  const global = useContext(GlobalContext);
  const [request] = useRequest();
  const [keyboardShown, keyboardHeight] = useKeyboard();

  props.navigation.setOptions({
    headerShown: true,
    title: state.username ? `${state.username}'s Post` : "",
    gestureEnabled: true,
  });

  useEffect(() => {
    (async () => {
      const response = await getPostInfo(props.route.params.postId);
      if (response.ok) {
        setState({
          ...state,
          ...response.data,
          originalReactions: response.data.reactions,
          loading: false,
        });
      } else setState({ ...state, loading: false });
    })();
  }, []);

  const getPostInfo = async (id: string) => {
    return request({
      url: "/user/posts/post",
      method: "GET",
      params: { id },
    });
  };

  const refresh = async () => {
    setState({ ...state, refreshingLoading: true });
    const response = await getPostInfo(props.route.params.postId);
    if (response.ok) {
      setState({ ...response.data, refreshingLoading: false });
    } else setState({ ...state, refreshingLoading: false });
  };

  const onToggleLikePostCallback = (_: string, currentlyLiked: boolean) => {
    const postData = {
      reactions: state.reactions,
      originalReactions: state.originalReactions,
    };

    const reactionData = findReactionObjectFromArray(
      "like",
      postData.reactions
    );
    if (!reactionData) return;
    const { index: reactionIndex } = reactionData;
    const originalReactionData = findReactionObjectFromArray(
      "like",
      postData.originalReactions
    );
    if (reactionIndex > -1) {
      postData.reactions[reactionIndex].reacted = !postData.reactions[
        reactionIndex
      ].reacted;
      if (originalReactionData) {
        if (originalReactionData.postReaction.reacted) {
          postData.reactions[reactionIndex].count = currentlyLiked
            ? postData.originalReactions[reactionIndex].count
            : postData.originalReactions[reactionIndex].count + 1;
        } else {
          postData.reactions[reactionIndex].count = currentlyLiked
            ? postData.originalReactions[reactionIndex].count - 1
            : postData.originalReactions[reactionIndex].count;
        }
        postData.reactions.splice(
          reactionIndex,
          1,
          postData.reactions[reactionIndex]
        );
      } else {
        postData.reactions[reactionIndex].count = 1;
      }
      setState((state) => ({ ...state, ...postData }));
    }
  };

  const onViewProfile = () => {
    props.navigation.push("UneditableProfile", { username: state.username });
  };

  const onDeletePostCallback = () => {
    if (state.username !== global.state.username) return;
    props.route.params.onDeletePostCallback(props.route.params.postId);
    props.navigation.goBack();
  };

  const onFinishEdit: OnFinishEdit = ({ newDescription }) => {
    if (state.username !== global.state.username) return;
    setState({ ...state, description: newDescription });
  };

  const onPressReactionCallback = (newReactions: PostReaction[]) => {
    setState({ ...state, reactions: newReactions });
  };

  const onPressComment: PushToComments = (_) => {
    props.navigation.push("ViewPostComments", {
      postId: props.route.params.postId,
      description: state.description,
      username: state.username,
      avatar: state.avatar,
    });
  };

  const findComment = (commentId: string) => {
    const index = state.comments.findIndex(({ id }) => id === commentId);
    if (index === -1) return;
    const comment = state.comments[index];
    return { comment, index };
  };

  const submitCommentCallback = (comment: Comment) => {
    const commentId = comment.id;
    const commentData = findComment(commentId);
    if (commentData) {
      const commentsCopy = state.comments;
      const { index, comment } = commentData;
      commentsCopy.splice(index, 1, comment);
      setState({ ...state, comments: commentsCopy });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            onRefresh={refresh}
            refreshing={state.refreshingLoading}
          />
        }
        style={{ backgroundColor }}
        contentContainerStyle={{ paddingBottom: bottomTabBarOffset + 20 }}
      >
        {state.loading ? (
          <PlaceholderContainer style={{ marginTop: 15 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <PlaceholderMedia
                size={35}
                isRound
                style={{ marginHorizontal: 10 }}
              />
              <PlaceholderLine width={30} noMargin />
            </View>
            <PlaceholderLine
              width={30}
              style={{ marginTop: 10, marginLeft: 10 }}
            />

            <PlaceholderMedia
              style={{
                width: "100%",
                height: undefined,
                aspectRatio: 7 / 8,
                borderRadius: 0,
              }}
            />
            <View style={{ marginHorizontal: 10, marginVertical: 15 }}>
              <PlaceholderLine width={100} />
              <PlaceholderLine width={100} />
              <PlaceholderLine width={100} />
              <PlaceholderLine width={100} />
              <PlaceholderLine width={100} />
            </View>
          </PlaceholderContainer>
        ) : (
          <ImagePost
            {...state}
            id={props.route.params.postId}
            postIndex={0}
            hideCommentInput
            onPressReactionCallback={onPressReactionCallback}
            onToggleLikePostCallback={onToggleLikePostCallback}
            onDeletePostCallback={onDeletePostCallback}
            onReportPostCallback={onDeletePostCallback}
            onToggleFollowCallback={() => {}}
            onBlockPostCallback={onDeletePostCallback}
            onFinishEdit={onFinishEdit}
            onViewProfile={onViewProfile}
            onPressComment={onPressComment}
            submitCommentCallback={submitCommentCallback}
          />
        )}
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

export default ViewPost;
