import React, { forwardRef, useContext } from "react";
import { Modalize } from "react-native-modalize";
import SlideUp from "../SlideUp";
import { SlideUpButtonBase, SlideUpButton } from "../Buttons";
import { InitialFocusedCommentState } from "../../../screens/Common/ViewPostComments";
import { Avatar } from "../../Miscellaneous";
import { GlobalContext } from "../../../contexts";
import { popup, showBanner } from "../../../utils";
import { useRequest } from "../../../hooks";

interface Props extends InitialFocusedCommentState {
  onPressViewProfile: (username: string) => void;
  openBlockUserSlideUp: () => void;
  openReportUserSlideUp: () => void;
  onDeleteCommentCallback: (commentId: string) => void;
  closeCommentOptionsSlideUp: () => void;
}

const CommentsSlideUp = forwardRef((props: Props, ref: React.Ref<Modalize>) => {
  const global = useContext(GlobalContext);
  const [request] = useRequest();

  const onDeleteComment = async () => {
    popup({
      title: "Are you sure you would like to delete this comment?",
      buttonOptions: [
        {
          text: "No",
          onPress: () => {},
        },
        {
          text: "Yes",
          onPress: async () => {
            props.closeCommentOptionsSlideUp();
            const response = await request({
              url: "user/posts/comment",
              method: "DELETE",
              body: { id: props.commentId },
            });
            if (response.ok) {
              props.onDeleteCommentCallback &&
                props.onDeleteCommentCallback(props.commentId);
            } else {
              showBanner({ message: "An erorr occurred.", type: "danger" });
            }
          },
          style: "destructive",
        },
      ],
    });
  };

  return (
    <SlideUp ref={ref}>
      <SlideUpButtonBase
        title={props.username}
        IconComponent={
          <Avatar style={{ width: 25, height: 25 }} avatar={props.avatar} />
        }
        onPress={() => props.onPressViewProfile(props.username)}
      />
      {global.state.username !== props.username ? (
        <>
          <SlideUpButton
            type="block"
            onPress={props.openBlockUserSlideUp}
            title={`Block ${props.username}`}
          />
          <SlideUpButton
            type="report"
            onPress={props.openReportUserSlideUp}
            title={`Report ${props.username}`}
          />
        </>
      ) : (
        <SlideUpButton
          type="delete"
          onPress={onDeleteComment}
          title={`Delete Comment`}
        />
      )}
    </SlideUp>
  );
});

export default CommentsSlideUp;
