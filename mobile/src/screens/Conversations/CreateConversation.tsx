import {
  FlatList,
  Image,
  Keyboard,
  TouchableOpacity,
  View,
} from "react-native";
import {
  LoadingIndicator,
  ParentView,
  ProfileItem,
  SearchBar,
  Text,
} from "../../components";
import React, { useContext, useRef, useState } from "react";
import { defaultHorizontalInset, shadowBox } from "../../constants";
import {
  getRandomHumanEmoji,
  defaultPaginationState,
  PaginationState,
} from "../../utils";
import { useKeyboard, useRequest } from "../../hooks";

import { ThemeContext, ConversationContext } from "../../contexts";
import { ConversationsStackNavProps } from "../../navigation";
import { searchHero } from "../../assets";

interface SearchResult {
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isOnline: boolean | undefined;
}

type Props = ConversationsStackNavProps<"CreateConversation">;

interface State extends PaginationState {
  searchSubstring: string;
  users: SearchResult[];
  searchQueryChangeLoading: boolean;
}

const initialState: State = {
  ...defaultPaginationState,
  searchSubstring: "",
  users: [],
  searchQueryChangeLoading: true,
};

const Search = (props: Props) => {
  const { liftedBackgroundColor } = useContext(ThemeContext);
  const conversationContext = useContext(ConversationContext);
  const [state, setState] = useState(initialState);
  const onEndReachedCalledDuringMomentum: any = useRef(null);
  const [keyboardShown, keyboardHeight] = useKeyboard();
  const [request] = useRequest();
  const inputRef: any = useRef(null);
  const searchThrottler: any = useRef();

  props.navigation.setOptions({
    headerTitle: "New Conversation",
  });

  const getUsers = async (params: {
    page: number;
    pageSize: number;
    username: string;
  }) => {
    return request({
      url: "user/conversations/search",
      method: "GET",
      params,
    });
  };

  const updateSubstring = async (searchSubstring: string) => {
    if (searchSubstring.length === 0 && state.users.length > 0) {
      return setState({ ...state, users: [] });
    }
    setState({ ...state, searchQueryChangeLoading: true });
    if (searchThrottler.current) clearTimeout(searchThrottler.current);
    searchThrottler.current = setTimeout(async () => {
      const response = await getUsers({
        username: searchSubstring,
        page: 1,
        pageSize: state.pageSize,
      });
      setState({
        ...state,
        users: response.ok ? response.data.users : [],
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        searchQueryChangeLoading: false,
        searchSubstring,
      });
    }, 400);
  };

  const paginate = async () => {
    if (state.reachedEnd || state.paginationLoading) return;
    setState({ ...state, paginationLoading: true });
    const response = await getUsers({
      username: state.searchSubstring,
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState({
        ...state,
        users: [...state.users, ...response.data.users],
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        paginationLoading: false,
      });
    } else {
      return setState({ ...state, paginationLoading: false });
    }
  };

  const onPressProfileItem = async (username: string) => {
    // request to make a new conversation, then push to next stack?
    const { conversationId } = await conversationContext.createConversation({
      usernames: [username],
    });

    props.navigation.push("Conversation", { conversationId });
  };

  const SearchResults = () => {
    return (
      <FlatList
        style={{ paddingHorizontal: defaultHorizontalInset }}
        data={state.users}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        keyExtractor={(_, index: number) => index.toString()}
        onEndReachedThreshold={0.5}
        onMomentumScrollBegin={() => {
          onEndReachedCalledDuringMomentum.current = false;
        }}
        onEndReached={() => {
          if (!onEndReachedCalledDuringMomentum.current) {
            paginate();
            onEndReachedCalledDuringMomentum.current = true;
          }
        }}
        ListFooterComponent={
          state.paginationLoading && !state.reachedEnd ? (
            <LoadingIndicator style={{ marginTop: 20, marginBottom: 20 }} />
          ) : null
        }
        renderItem={({ item }) => (
          <ProfileItem
            {...item}
            isOnline={undefined}
            onPress={async () => onPressProfileItem(item.username)}
          />
        )}
      />
    );
  };

  const SearchHero = () => (
    <TouchableOpacity activeOpacity={1} onPress={Keyboard.dismiss}>
      <Image
        source={searchHero}
        style={{
          width: 330,
          height: 300,
          resizeMode: "contain",
          alignSelf: "center",
          marginTop: 70,
        }}
      />
    </TouchableOpacity>
  );

  return (
    <ParentView noScroll noHorizontalPadding noBottomTabOffset>
      <TouchableOpacity activeOpacity={1} onPress={Keyboard.dismiss}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
            backgroundColor: liftedBackgroundColor,
            paddingVertical: 5,
            marginHorizontal: defaultHorizontalInset,
            borderRadius: 10,
            marginBottom: 10,
            ...shadowBox,
          }}
        >
          <View style={{ flex: 1 }}>
            <SearchBar
              style={{ borderWidth: 0 }}
              inputViewStyle={{
                marginRight: state.searchSubstring.length > 0 ? 0 : 10,
              }}
              searchSubstring={state.searchSubstring}
              onChangeText={async (substring) => updateSubstring(substring)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Backspace") {
                  setState({ ...state, page: 1, reachedEnd: false });
                }
              }}
              searchInputProps={{
                autoCapitalize: "none",
                autoFocus: true,
                placeholder: `Search a username...`,
                onSubmitEditing: async () => {
                  const { page, pageSize, searchSubstring } = state;
                  const response = await getUsers({
                    username: searchSubstring,
                    page,
                    pageSize,
                  });
                  if (response.ok) {
                    setState({ ...state, users: response.data.users });
                  }
                },
              }}
            />
          </View>
          {state.searchSubstring.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                setState({ ...state, searchSubstring: "" });
                inputRef?.current?.input?.clear();
              }}
              style={{ alignSelf: "center", marginLeft: 15, marginRight: 10 }}
            >
              <Text w="bold">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
      <View style={{ flex: 1, paddingBottom: keyboardHeight - 70 }}>
        {state.searchSubstring ? SearchResults() : SearchHero()}
      </View>
    </ParentView>
  );
};

export default Search;
