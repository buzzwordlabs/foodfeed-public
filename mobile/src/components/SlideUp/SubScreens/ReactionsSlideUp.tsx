import React, {
  forwardRef,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
// import SlideUp from "../SlideUp";
import { Portal } from "react-native-portalize";
import { Modalize } from "react-native-modalize";
import {
  window,
  defaultHorizontalInset,
  bottomTabBarOffset,
} from "../../../constants";
import { Text, LoadingIndicator, Icon } from "../../Primitives";
import {
  RefreshControl,
  View,
  Platform,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { ThemeContext } from "../../../contexts";
import { ProfileItem } from "../../Lists";
import {
  PostReactionStringOptions,
  PaginationState,
  defaultPaginationState,
} from "../../../utils";
import { useRequest } from "../../../hooks";
import { XCloseButton } from "../../Miscellaneous";

export interface ReactionUser {
  avatar: string;
  username: string;
  firstName: string;
  lastName: string;
}

export type Props = {
  ref: React.Ref<Modalize>;
  onClose: () => any | Promise<any>;
  onPressCloseButton: () => void;
  onPressUser: (username: string) => void;
  reaction: PostReactionStringOptions | "";
  count: number;
  postId: string;
};

interface State extends PaginationState {
  reactionUsers: ReactionUser[];
}

const initialState: State = {
  ...defaultPaginationState,
  reactionUsers: [],
};

const ReactionsSlideUp = React.memo(
  forwardRef((props: Props, ref: React.Ref<Modalize>) => {
    const { backgroundColor, textColor } = useContext(ThemeContext);
    const [state, setState] = useState(initialState);
    const [request] = useRequest();
    const prevPropReaction: React.MutableRefObject<
      PostReactionStringOptions | ""
    > = useRef("");

    useEffect(() => {
      if (
        props.reaction !== prevPropReaction.current &&
        props.reaction !== ""
      ) {
        prevPropReaction.current = props.reaction;
        (async () => initLoad())();
      }
    }, [props.reaction]);

    const initLoad = async () => {
      const response = await getPostReactions({
        page: 1,
        pageSize: state.pageSize,
      });
      if (response.ok) {
        return setState({
          ...state,
          reactionUsers: response.data.users,
          page: response.data.page + 1,
          reachedEnd: response.data.reachedEnd,
          initLoading: false,
        });
      } else {
        return setState({ ...state, initLoading: false });
      }
    };

    const onRefresh = async () => {
      setState({ ...state, refreshing: true });
      const response = await getPostReactions({ page: 1, pageSize: 10 });
      if (response.ok) {
        setState({
          ...state,
          reactionUsers: response.data.users,
          refreshing: false,
        });
      } else {
        setState({ ...state, refreshing: false });
      }
    };

    const getPostReactions = async (params: {
      page: number;
      pageSize: number;
    }) => {
      return request({
        url: "/user/posts/reactions",
        method: "GET",
        params: { id: props.postId, reaction: props.reaction, ...params },
      });
    };

    const paginate = async () => {
      if (state.reachedEnd || state.paginationLoading) return;
      setState({ ...state, paginationLoading: true });
      const response = await getPostReactions({
        page: state.page,
        pageSize: state.pageSize,
      });
      if (response.ok) {
        return setState(({ reactionUsers }) => ({
          ...state,
          reactionUsers: [...reactionUsers, ...response.data.users],
          page: response.data.page + 1,
          reachedEnd: response.data.reachedEnd,
          paginationLoading: false,
        }));
      } else {
        return setState({ ...state, paginationLoading: false });
      }
    };

    const RefreshControlComponent = () => {
      return (
        <RefreshControl
          refreshing={state.refreshing}
          onRefresh={onRefresh}
          tintColor={textColor}
        />
      );
    };

    const ListEmptyComponent = () => {
      if (!state.initLoading && props.count === 0) {
        return (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ marginTop: 20 }} s="lg" w="bold" a="center">
              Sorry, no reactions!
            </Text>
          </View>
        );
      } else if (state.initLoading) {
        return <LoadingIndicator style={{ marginTop: 40 }} />;
      } else return <></>;
    };

    const ListFooterComponent = () => {
      if (state.paginationLoading) {
        return (
          <LoadingIndicator
            style={{ marginTop: 40, marginBottom: bottomTabBarOffset }}
          />
        );
      }
      if (state.reachedEnd && state.reactionUsers.length > 0) {
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
      return <></>;
    };

    return (
      <Portal>
        <Modalize
          ref={ref}
          withHandle={false}
          adjustToContentHeight={false}
          panGestureEnabled={false}
          disableScrollIfPossible
          onClose={props.onClose}
          modalStyle={{ backgroundColor }}
          HeaderComponent={
            <View
              style={{
                alignSelf: "flex-end",
                marginVertical: 10,
                flexDirection: "row",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ marginRight: 5 }}>
                  <Text s="lg" w="bold">
                    {props.count}
                  </Text>
                </View>
                <Icon
                  library="ionicons"
                  name={`${Platform.OS === "ios" ? "ios" : "md"}-people`}
                  size={26}
                />
              </View>
              <View style={{ marginHorizontal: 10 }}>
                <XCloseButton onPress={props.onPressCloseButton} />
              </View>
            </View>
          }
          flatListProps={{
            style: { paddingHorizontal: defaultHorizontalInset },
            data: state.reactionUsers,
            keyExtractor: (_: any, index: number) => index.toString(),
            refreshControl: RefreshControlComponent(),
            ListEmptyComponent: ListEmptyComponent(),
            ListFooterComponent: ListFooterComponent(),
            onEndReachedThreshold: 0,
            onEndReached: paginate,
            renderItem: ({
              item,
              index,
            }: {
              item: ReactionUser;
              index: number;
            }) => (
              <ProfileItem
                {...item}
                isOnline={undefined}
                activeOpacity={1}
                onPress={() => props.onPressUser(item.username)}
              />
            ),
          }}
        ></Modalize>
      </Portal>
    );
  })
);

export default ReactionsSlideUp;
