import {
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  Platform,
  Keyboard,
} from "react-native";
import {
  getRandomHumanEmoji,
  cleanOutgoingText,
  showBanner,
} from "../../utils";
import { ThemeContext, GlobalContext } from "../../contexts";
import { useContext, useState } from "react";
import { tintColor, muli, muliBold } from "../../constants";
import React from "react";
import { Avatar } from "../Miscellaneous";
import { Icon, LoadingIndicator } from "../Primitives";
import { useLoadingRequest } from "../../hooks";
import { Comment } from "./ImagePost";

const randomHumanEmoji = getRandomHumanEmoji();

interface Props {
  postId: string;
  submitCommentCallback: (comment: Comment) => void;
}

const CommentInput = React.memo((props: Props) => {
  const [comment, setComment] = useState("");
  const { themeName, textColor, borderColor } = useContext(ThemeContext);
  const global = useContext(GlobalContext);
  const [request, loading] = useLoadingRequest();

  const submit = async () => {
    const [cleanedText, error] = cleanOutgoingText({
      text: comment,
      restrictProfane: false,
    });
    if (error === "too_short") {
      return showBanner({
        message: "Comments can't be blank.",
        type: "danger",
      });
    }

    const response = await request({
      url: "user/posts/comment",
      method: "POST",
      body: { id: props.postId, comment: cleanedText },
    });
    Keyboard.dismiss();
    if (response.ok) {
      props.submitCommentCallback({
        ...response.data.comment,
        username: global.state.username,
        avatar: global.state.avatar,
      });
      setComment("");
    } else {
      showBanner({ message: "An error occurred.", type: "danger" });
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        marginTop: 15,
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 6,
      }}
    >
      <Avatar avatar={global.state.avatar} style={{ width: 35, height: 35 }} />
      <TextInput
        value={comment}
        style={{
          flex: 1,
          fontFamily: comment.length > 0 ? muli : muliBold,
          color: textColor,
          fontSize: 14,
          textAlignVertical: "top",
          marginLeft: 10,
          paddingVertical: 10,
        }}
        maxLength={300}
        scrollEnabled={false}
        autoCapitalize="sentences"
        onChangeText={setComment}
        allowFontScaling={false}
        selectionColor={tintColor}
        keyboardAppearance={themeName}
        placeholderTextColor="gray"
        placeholder={`Add a comment ${randomHumanEmoji}`}
      />
      {comment.length > 0 ? (
        loading ? (
          <LoadingIndicator />
        ) : (
          <TouchableOpacity style={{ paddingLeft: 10 }} onPress={submit}>
            <Icon
              library="ionicons"
              name={`${Platform.OS === "ios" ? "ios" : "md"}-send`}
              color={tintColor}
              size={26}
            />
          </TouchableOpacity>
        )
      ) : null}
    </View>
  );
});

export default CommentInput;
