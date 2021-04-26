import React, { useContext, useState, useRef } from "react";
import { TouchableOpacity, View, TextInput, Keyboard } from "react-native";
import { Text, LoadingIndicator } from "../Primitives";
import { tintColor, window, muli, appName } from "../../constants";
import { Avatar, Divider } from "../Miscellaneous";
import {
  BlockUserSlideUp,
  ReportUserSlideUp,
  SlideUp,
  SlideUpButton,
  SlideUpButtonBase,
  EmojiPickerSlideUp,
  ReactionsSlideUp,
  HelpFeedbackSlideUp,
} from "../SlideUp";
import { useSlideUp, useLoadingRequest } from "../../hooks";
import { GlobalContext, ThemeContext } from "../../contexts";
import {
  popup,
  launchShare,
  calculateDimensions,
  showBanner,
  PostReaction,
  PostReactionsEmojiIndexed,
  findReactionObjectFromArray,
  PostReactionStringOptions,
  PostReactionsStringIndexed,
  tinyVibration,
} from "../../utils";
import { ImagePostCarousel } from "../Carousels";
import { OnFinishEdit } from "../../screens/Home/Home/types";
import PostReactions from "./PostReactions";
import Comment from "./Comment";
import CommentInput from "./CommentInput";
import MediaFooter from "./MediaFooter";
import PostHeader from "./PostHeader";
import { ViewPostCommentsParams } from "../../navigation";

const { width, height } = calculateDimensions({
  width: window.width,
  ratio: "7:8",
});

export interface Comment {
  id: string;
  postId: string;
  username: string;
  avatar: string;
  comment: string;
  createdAt: string;
}

export interface Post {
  id: string;
  description: string;
  reactions: PostReaction[];
  originalReactions: PostReaction[];
  media: { postId: string; type: "image" | "video"; uri: string }[];
  edited: string;
  createdAt: string;
  avatar: string;
  username: string;
  isFollowing: boolean;
  commentCount: number;
  comments: Comment[];
}

interface Props extends Post {
  postIndex: number;
  hideCommentInput?: boolean;
  onToggleLikePostCallback: (postId: string, currentlyLiked: boolean) => void;
  onDeletePostCallback: (postId: string) => void;
  onBlockPostCallback: (postId: string) => void;
  onReportPostCallback: (postId: string) => void;
  onViewProfile: (username: string) => void;
  onPressReactionCallback: (
    newReactions: PostReaction[],
    postIndex: number
  ) => void;
  onToggleFollowCallback: ({
    username,
    wasFollowing,
  }: {
    username: string;
    wasFollowing: boolean;
  }) => void;
  onFinishEdit: OnFinishEdit;
  onPressComment: (args: ViewPostCommentsParams) => void;
  submitCommentCallback: (comment: Comment) => void;
}

interface State {
  currentIndex: number;
  isEditing: boolean;
  currentReaction: PostReactionStringOptions;
  loading: boolean;
  refreshing: boolean;
  followLoading: boolean;
}

const initialState: State = {
  currentIndex: 0,
  isEditing: false,
  currentReaction: "" as PostReactionStringOptions,
  loading: false,
  refreshing: false,
  followLoading: false,
};

const ImagePost = (props: Props) => {
  const global = useContext(GlobalContext);
  const { textColor, themeName, borderColor } = useContext(ThemeContext);
  const [request, loading] = useLoadingRequest();
  const [editedDescription, setEditedDescription] = useState("");

  const [state, setState] = useState(initialState);
  const makeToggleLikePostRequestRef: any = useRef(null);
  const makeToggleReactionQueueRef: React.MutableRefObject<
    { [key in PostReactionStringOptions]: NodeJS.Timeout | undefined }
  > = useRef(
    {} as { [key in PostReactionStringOptions]: NodeJS.Timeout | undefined }
  );
  const [
    imagePostOptionsRef,
    openImagePostOptionsSlideUp,
    closeImagePostOptionsSlideUp,
  ] = useSlideUp();
  const [
    reactionsSlideUpRef,
    openReactionsSlideUp,
    closeReactionsSlideUp,
  ] = useSlideUp();
  const [
    reportUserRef,
    openReportUserSlideUp,
    closeReportUserSlideUp,
  ] = useSlideUp();
  const [emojiPickerRef, openEmojiPicker, closeEmojiPicker] = useSlideUp();
  const [
    blockUserRef,
    openBlockUserSlideUp,
    closeBlockUserSlideUp,
  ] = useSlideUp();
  const [editPostRef, openEditPostSlideUp, closeEditPostSlideUp] = useSlideUp();
  const [
    helpFeedbackSlideUp,
    openHelpFeedbackSlideUp,
    closeHelpFeedbackSlideUp,
  ] = useSlideUp();

  const onViewReactionUsers = async (
    reactionString: PostReactionStringOptions
  ) => {
    openReactionsSlideUp();
    setState({ ...state, currentReaction: reactionString });
  };

  const onTogglePostReaction = (
    reactions: PostReaction[],
    reactionString: PostReactionStringOptions
  ) => {
    const reactionData = findReactionObjectFromArray(reactionString, reactions);
    if (reactionData) {
      return reactions.map((reaction) => {
        if (reaction.reaction === reactionString) {
          reaction.reacted = !reaction.reacted;
          reaction.count = reaction.count + (!reaction.reacted ? -1 : 1);
        }
        return reaction;
      });
    } else {
      return [
        ...reactions,
        {
          postId: props.id,
          reaction: reactionString,
          count: 1,
          reacted: true,
        },
      ];
    }
  };

  const postCurrentLiked = (reactions: PostReaction[]) => {
    let liked = false;
    reactions.forEach((reaction) => {
      if (reaction.reaction === "like" && reaction.reacted) {
        liked = true;
      }
    });
    return liked;
  };

  const onToggleLikePost = async () => {
    closeImagePostOptionsSlideUp();
    props.onToggleLikePostCallback &&
      props.onToggleLikePostCallback(
        props.id,
        postCurrentLiked(props.reactions)
      );
    if (makeToggleLikePostRequestRef.current) {
      clearTimeout(makeToggleLikePostRequestRef.current);
      makeToggleLikePostRequestRef.current = null;
    } else {
      makeToggleLikePostRequestRef.current = setTimeout(async () => {
        await request({
          url: "user/posts/react",
          method: "POST",
          body: { id: props.id, reaction: PostReactionsEmojiIndexed["❤️"] },
        });
        makeToggleLikePostRequestRef.current = null;
      }, 2000);
    }
  };

  const onDeletePost = async () => {
    popup({
      title: "Are you sure you would like to delete this post?",
      buttonOptions: [
        {
          text: "No",
          onPress: () => {},
        },
        {
          text: "Yes",
          onPress: async () => {
            closeImagePostOptionsSlideUp();
            const response = await request({
              url: "user/posts",
              method: "DELETE",
              body: { id: props.id },
            });
            if (response.ok) {
              props.onDeletePostCallback &&
                props.onDeletePostCallback(props.id);
            }
          },
          style: "destructive",
        },
      ],
    });
  };

  const onShare = async () => {
    await launchShare({
      type: "toViewPost",
      title: "FoodFeed",
      message: `Check out this post on ${appName}!`,
      deepLinkArgs: { postId: props.id },
    });
    closeImagePostOptionsSlideUp();
  };

  const startEditPost = () => {
    closeImagePostOptionsSlideUp();
    openEditPostSlideUp();
    if (editedDescription === "") {
      setEditedDescription(props.description);
    }
    setState((state) => ({
      ...state,
      isEditing: true,
    }));
  };

  const cancelEditPost = () => {
    Keyboard.dismiss();
    closeEditPostSlideUp();
  };

  const finishEditPost = async () => {
    closeEditPostSlideUp();
    if (editedDescription === props.description) return;
    props.onFinishEdit({
      newDescription: editedDescription,
      postId: props.id,
    });
    const response = await request({
      url: "/user/posts",
      method: "PUT",
      body: { id: props.id, description: editedDescription },
    });
    if (response.ok) {
      setState((state) => ({
        ...state,
        isEditing: false,
        editedDescription: "",
        currentDescription: editedDescription,
      }));
      showBanner({ message: "Success!", type: "success" });
    } else {
      showBanner({
        message:
          "Something went wrong while trying to save your post. Please try again.",
        type: "danger",
      });
    }
  };

  const onViewPostOwnerProfile = () => {
    closeImagePostOptionsSlideUp();
    props.onViewProfile(props.username);
  };

  const onReportSuccess = () => {
    props.onReportPostCallback && props.onReportPostCallback(props.id);
  };

  const onBlockSubmit = () => {
    closeBlockUserSlideUp();
    closeImagePostOptionsSlideUp();
    props.onBlockPostCallback && props.onBlockPostCallback(props.id);
  };

  const onViewProfile = (username: string) => {
    closeReactionsSlideUp();
    props.onViewProfile(username);
  };

  const onFailReport = () => {
    showBanner({
      message: "An error occurred while reporting this user.",
      type: "danger",
    });
  };

  const onSubmitReport = () => {
    closeImagePostOptionsSlideUp();
    closeReportUserSlideUp();
  };

  const toggleFollow = async () => {
    closeImagePostOptionsSlideUp();

    const handleRequest = async () => {
      setState({ ...state, followLoading: true });
      const response = await request({
        url: "/user/followers",
        method: props.isFollowing ? "DELETE" : "POST",
        body: { username: props.username },
      });
      if (response.ok) {
        setState({ ...state, followLoading: false });
        props.onToggleFollowCallback({
          username: props.username,
          wasFollowing: props.isFollowing,
        });
      } else {
        setState({ ...state, followLoading: false });
      }
    };

    if (props.isFollowing) {
      popup({
        title: `Unfollow ${props.username}`,
        description: `Are you sure you would like to unfollow ${props.username}?`,
        buttonOptions: [
          { text: "Cancel", onPress: () => {} },
          {
            text: "Unfollow",
            onPress: handleRequest,
            style: "destructive",
          },
        ],
      });
    } else {
      await handleRequest();
    }
  };

  const onReaction = async (emojiString: PostReactionStringOptions) => {
    if (!Object.keys(PostReactionsStringIndexed).includes(emojiString)) return;
    tinyVibration();
    closeEmojiPicker();
    const reactionsCopy = props.reactions;
    const newReactions = onTogglePostReaction(reactionsCopy, emojiString);

    props.onPressReactionCallback &&
      props.onPressReactionCallback(newReactions, props.postIndex);

    if (makeToggleReactionQueueRef.current[emojiString]) {
      clearTimeout(
        makeToggleReactionQueueRef.current[emojiString] as NodeJS.Timeout
      );
      makeToggleReactionQueueRef.current[emojiString] = undefined;
    } else {
      makeToggleReactionQueueRef.current[emojiString] = setTimeout(async () => {
        await request({
          url: "user/posts/react",
          method: "POST",
          body: { id: props.id, reaction: emojiString },
        });
        makeToggleReactionQueueRef.current[emojiString] = undefined;
      }, 1000);
    }
  };

  const onViewUsersLiked = () => {
    return onViewReactionUsers("like");
  };

  const onPressComment = () => {
    props.onPressComment({
      postId: props.id,
      username: props.username,
      avatar: props.avatar,
      description: props.description,
    });
  };

  const images = props.media.map((m) => m.uri);

  const isOwner = global.state.username === props.username;

  return (
    <View style={{ marginVertical: 10, paddingVertical: 15 }}>
      {/* Post Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 15,
          paddingHorizontal: 10,
        }}
      >
        <PostHeader
          avatar={props.avatar}
          username={props.username}
          createdAt={props.createdAt}
          isPostOwner={isOwner}
          isFollowing={props.isFollowing}
          onViewPostOwnerProfile={onViewPostOwnerProfile}
          toggleFollow={toggleFollow}
          openImagePostOptionsSlideUp={openImagePostOptionsSlideUp}
        />
      </View>
      {/* Image Carousel */}
      <View style={{ marginBottom: 5 }}>
        <ImagePostCarousel
          images={images}
          onIndexChange={(currentIndex) => setState({ ...state, currentIndex })}
          onPressDouble={onToggleLikePost}
          width={width}
          height={height}
          aspectRatio="7:8"
          imageType="fastImage"
        />
      </View>
      {/* Post Details */}
      <View style={{ paddingHorizontal: 10 }}>
        {/* Media Footer */}
        <View>
          <MediaFooter
            onToggleLikePost={onToggleLikePost}
            reactions={props.reactions}
            onViewUsersLiked={onViewUsersLiked}
            numCarouselDots={images.length}
            currentIndex={state.currentIndex}
          />
        </View>
        {/* Reactions */}
        <View style={{ marginBottom: 10 }}>
          <PostReactions
            reactions={props.reactions}
            onPressAddNewReaction={openEmojiPicker}
            onPressReaction={onReaction}
            onLongPressReaction={onViewReactionUsers}
          />
        </View>
        {/* Description */}
        <View>
          <Text style={{ fontSize: 13 }} truncateConfig={{ maxLength: 200 }}>
            {props.description}
          </Text>
        </View>
        {/* Comments */}
        <View>
          {props.comments.length > 0 && (
            <Divider
              direction="horizontal"
              style={{
                width: "25%",
                marginTop: 8,
                marginBottom: 14,
                borderBottomWidth: 1,
              }}
            />
          )}
          {props.comments.map((item, index) => (
            <Comment
              {...item}
              showAvatar={false}
              key={index}
              postId={props.id}
              onPressProfile={onViewProfile}
              onPressComment={onPressComment}
              truncate
            />
          ))}

          {props.commentCount > 3 && (
            <TouchableOpacity
              style={{ marginTop: 10 }}
              onPress={onPressComment}
            >
              <Text t="muted" s="sm">
                {props.commentCount === 0
                  ? "No comments"
                  : props.commentCount === 1
                  ? "View 1 comment"
                  : `View all ${props.commentCount} comments`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Comment Input */}
        {!props.hideCommentInput && (
          <View>
            <CommentInput
              postId={props.id}
              submitCommentCallback={props.submitCommentCallback}
            />
          </View>
        )}
      </View>
      <SlideUp ref={imagePostOptionsRef} withHandle={false}>
        <SlideUpButtonBase
          title={props.username}
          IconComponent={
            <Avatar style={{ width: 25, height: 25 }} avatar={props.avatar} />
          }
          onPress={onViewPostOwnerProfile}
        />
        {!isOwner ? (
          <>
            {!props.isFollowing && (
              <SlideUpButton
                type="follow"
                onPress={toggleFollow}
                title={`Follow ${props.username}`}
              />
            )}
            <SlideUpButton
              type="block"
              onPress={openBlockUserSlideUp}
              title={`Block ${props.username}`}
            />
            <SlideUpButton
              type="report"
              onPress={openReportUserSlideUp}
              title={`Report ${props.username}`}
            />
          </>
        ) : (
          <>
            <SlideUpButton
              type="edit"
              onPress={startEditPost}
              title={`Edit Post`}
            />
            <SlideUpButton
              type="delete"
              onPress={onDeletePost}
              title={`Delete Post`}
            />
          </>
        )}
        <SlideUpButton type="share" title="Share" onPress={onShare} />
        <SlideUpButton
          type="help_feedback"
          title="Help or Feedback"
          onPress={() => {
            closeImagePostOptionsSlideUp();
            openHelpFeedbackSlideUp();
          }}
        />
        <SlideUpButton type="close" onPress={closeImagePostOptionsSlideUp} />
      </SlideUp>
      <ReactionsSlideUp
        ref={reactionsSlideUpRef}
        onPressUser={onViewProfile}
        postId={props.id}
        reaction={state.currentReaction}
        count={
          findReactionObjectFromArray(state.currentReaction, props.reactions)
            ?.postReaction.count || 0
        }
        onClose={() =>
          setState({
            ...state,
            currentReaction: "" as PostReactionStringOptions,
          })
        }
        onPressCloseButton={closeReactionsSlideUp}
      />
      <ReportUserSlideUp
        ref={reportUserRef}
        onCancel={closeReportUserSlideUp}
        onSubmit={onSubmitReport}
        onSuccess={onReportSuccess}
        onFail={onFailReport}
        username={props.username}
        reportData={{ postId: props.id }}
        type="post"
      />
      <HelpFeedbackSlideUp
        ref={helpFeedbackSlideUp}
        onCancel={closeHelpFeedbackSlideUp}
        onSubmit={closeHelpFeedbackSlideUp}
      />
      <EmojiPickerSlideUp ref={emojiPickerRef} onPressEmoji={onReaction} />
      <BlockUserSlideUp
        ref={blockUserRef}
        onCancel={closeBlockUserSlideUp}
        onSubmit={onBlockSubmit}
        username={props.username}
      />
      <SlideUp
        panGestureEnabled={false}
        withHandle={false}
        ref={editPostRef}
        adjustToContentHeight={false}
        HeaderComponent={
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 20,
              paddingHorizontal: 15,
            }}
          >
            <TouchableOpacity onPress={cancelEditPost}>
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={finishEditPost}>
              {loading ? (
                <LoadingIndicator />
              ) : (
                <Text t="highlight" w="bold">
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
        }
      >
        <View style={{ paddingVertical: 20, paddingHorizontal: 20, flex: 1 }}>
          <Text a="left" s="subHeader" w="bold">
            Edit Post
          </Text>
          <View style={{ marginTop: 20, paddingTop: 20, paddingBottom: 20 }}>
            <TextInput
              autoFocus
              multiline
              keyboardAppearance={themeName}
              style={{
                color: textColor,
                fontFamily: muli,
                fontSize: 18,
                textAlignVertical: "top",
                height: window.height * 0.3,
                marginTop: 10,
              }}
              maxLength={2000}
              value={editedDescription}
              onChangeText={(editedDescription) => {
                setEditedDescription(editedDescription);
              }}
              autoCapitalize="sentences"
              maxFontSizeMultiplier={1.25}
              selectionColor={tintColor}
            />
            <View style={{ position: "absolute", top: 0, left: 0 }}>
              <Text s="sm">
                {editedDescription.length}/{2000}
              </Text>
            </View>
          </View>
        </View>
      </SlideUp>
    </View>
  );
};

export default ImagePost;
