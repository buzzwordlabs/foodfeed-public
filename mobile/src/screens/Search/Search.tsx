import {
  FlatList,
  Image,
  Keyboard,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Icon,
  LoadingIndicator,
  ParentView,
  ProfileItem,
  ProfileItemPlaceholder,
  SearchBar,
  Text,
} from "../../components";
import React, { useContext, useEffect, useRef, useState } from "react";
import { defaultHorizontalInset, shadowBox } from "../../constants";
import {
  deleteCache,
  readCache,
  writeCache,
  getRandomHumanEmoji,
} from "../../utils";
import { isArray } from "lodash";
import { useKeyboard, useRequest } from "../../hooks";

import { ThemeContext } from "../../contexts";
import { HomeStackNavProps } from "../../navigation";
import { searchHero } from "../../assets";

interface SearchResult {
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isOnline: boolean | undefined;
}

type Props = HomeStackNavProps<"Search">;
interface State {
  searchSubstring: string;
  cachedResults: SearchResult[];
  results: SearchResult[];
  searchQueryChangeLoading: boolean;
  pageSize: number;
  page: number;
  reachedEnd: boolean;
  paginationLoading: boolean;
  refreshing: boolean;
  showRecommended: boolean;
}

const initialState: State = {
  searchSubstring: "",
  cachedResults: [],
  results: [],
  searchQueryChangeLoading: true,
  pageSize: 15,
  page: 1,
  reachedEnd: false,
  paginationLoading: false,
  refreshing: false,
  showRecommended: false,
};

const randomFoodEmoji = getRandomHumanEmoji();

const Search = (props: Props) => {
  const { liftedBackgroundColor } = useContext(ThemeContext);
  const [state, setState] = useState(initialState);
  const onEndReachedCalledDuringMomentum: any = useRef(null);
  const [keyboardShown, keyboardHeight] = useKeyboard();
  const [request] = useRequest();
  const inputRef: any = useRef(null);
  const searchThrottler: any = useRef();

  useEffect(() => {
    (async () => {
      const cachedResults = await readCache("recentlySearchedUsers");
      if (isArray(cachedResults) && cachedResults.length > 0)
        setState({ ...state, cachedResults });
    })();
  }, []);

  const getUsers = async (params?: {
    page: number;
    pageSize: number;
    username: string;
  }) => {
    return request({
      url: "user/search/accounts",
      method: "GET",
      params,
    });
  };

  const openProfile = async (user: SearchResult) => {
    if (!user) return;
    const cachedUsernames = state.cachedResults.map((u) => u.username);
    if (cachedUsernames.includes(user.username))
      return props.navigation.push("UneditableProfile", {
        username: user.username,
      });
    const recentlySearchedUsers: SearchResult[] = await readCache(
      "recentlySearchedUsers"
    );
    if (isArray(recentlySearchedUsers)) {
      const newRecentlySearchedUsers = [
        user,
        ...recentlySearchedUsers.slice(0, 9),
      ];
      await writeCache("recentlySearchedUsers", newRecentlySearchedUsers);
      setState({ ...state, cachedResults: newRecentlySearchedUsers });
    } else await writeCache("recentlySearchedUsers", [user]);
    props.navigation.push("UneditableProfile", { username: user.username });
  };

  const updateSubstring = async (searchSubstring: string) => {
    if (searchSubstring.length === 0 && state.results.length > 0) {
      return setState({ ...state, results: [] });
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
        results: response.ok ? response.data.users : [],
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        showRecommended: response.data.recommended,
        searchQueryChangeLoading: false,
        searchSubstring,
      });
    }, 400);
  };

  const removeResultFromCache = async (user: SearchResult) => {
    const cachedResults: SearchResult[] = await readCache(
      "recentlySearchedUsers"
    );
    const newCachedResults = cachedResults.filter(
      (result) => result.username !== user.username
    );
    await deleteCache("recentlySearchedUsers");
    await writeCache("recentlySearchedUsers", newCachedResults);
    setState({ ...state, cachedResults: newCachedResults });
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
        results: [...state.results, ...response.data.users],
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        paginationLoading: false,
      });
    } else {
      return setState({ ...state, paginationLoading: false });
    }
  };

  const CachedResults = () => (
    <>
      <Text
        s="sm"
        w="semiBold"
        style={{ marginTop: 20, paddingHorizontal: defaultHorizontalInset }}
      >
        Recently Searched
      </Text>
      <FlatList
        style={{ paddingHorizontal: defaultHorizontalInset }}
        data={state.cachedResults}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        keyExtractor={(_item: any, index: number) => index.toString()}
        renderItem={({ item }) => (
          <ProfileItem
            {...item}
            isOnline={undefined}
            onPress={openProfile}
            RightAlignedComponent={
              <TouchableOpacity
                onPress={() => removeResultFromCache(item)}
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  width: 30,
                  height: 30,
                }}
              >
                <Icon library="antdesign" name="close" size={16} />
              </TouchableOpacity>
            }
          />
        )}
      />
    </>
  );

  const Placeholder = () => {
    return (
      <View style={{ paddingHorizontal: defaultHorizontalInset }}>
        <ProfileItemPlaceholder />
        <ProfileItemPlaceholder />
        <ProfileItemPlaceholder />
        <ProfileItemPlaceholder />
        <ProfileItemPlaceholder />
        <ProfileItemPlaceholder />
      </View>
    );
  };

  const SearchResults = () => {
    return (
      <FlatList
        style={{ paddingHorizontal: defaultHorizontalInset }}
        data={state.results}
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
        renderItem={({ item, index }) => {
          return (
            <>
              {state.showRecommended && index === 0 && (
                <View style={{ marginHorizontal: 5 }}>
                  <Text>
                    No people were found, but here are some recommendations
                  </Text>
                </View>
              )}
              <ProfileItem {...item} onPress={openProfile} />
            </>
          );
        }}
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
    <ParentView noScroll noHorizontalPadding safeBottomInset={!keyboardShown}>
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
                placeholder: `Find a friend ${randomFoodEmoji}`,
                onSubmitEditing: async () => {
                  const { page, pageSize, searchSubstring } = state;
                  const response = await getUsers({
                    username: searchSubstring,
                    page,
                    pageSize,
                  });
                  if (response.ok) {
                    setState({ ...state, results: response.data.users });
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
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        {state.searchSubstring
          ? state.searchQueryChangeLoading
            ? Placeholder()
            : SearchResults()
          : state.cachedResults.length > 0
          ? CachedResults()
          : SearchHero()}
      </View>
    </ParentView>
  );
};

export default Search;
