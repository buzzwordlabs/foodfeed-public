import {
  HeaderTextButton,
  ParentView,
  Text,
  Icon,
  LoadingIndicator,
  GoBackButton,
} from "../../components";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { cloneDeep, isEqual } from "lodash";
import { defaultHorizontalInset, tintColor } from "../../constants";
import { showBanner, popup } from "../../utils";

import { AccountStackNavProps } from "../../navigation";
import { useLoadingRequest, useRequest } from "../../hooks";
import { ThemeContext } from "../../contexts";

type Props = AccountStackNavProps<"BlockList">;

interface State {
  blockedUsers: BlockedUser[];
  originalBlockedUsers: BlockedUser[];
}

interface BlockedUser {
  username: string;
  blocked: boolean;
}

const initialState: State = {
  blockedUsers: [],
  originalBlockedUsers: [],
};

const BlockList = (props: Props) => {
  const [state, setState] = useState(initialState);
  const { blockedUsers } = state;
  const [request] = useRequest();
  const [error, setError] = useState(false);
  const [loadingState, setLoadingState] = useState({
    initLoading: true,
    refreshingLoading: false,
    uploadLoading: false,
  });

  const onToggle = (username: string) => {
    const { blockedUsers } = state;
    if (blockedUsers.length < 0) return;
    const newBlockedUsers = blockedUsers.map((user) => {
      if (user.username === username) {
        user.blocked = !user.blocked;
      }
      return user;
    });
    setState({ ...state, blockedUsers: newBlockedUsers });
  };

  props.navigation.setOptions({
    headerLeft: () => (
      <GoBackButton
        onPress={async () => {
          const { originalBlockedUsers, blockedUsers } = state;
          const dataChanged = !isEqual(originalBlockedUsers, blockedUsers);
          if (dataChanged)
            popup({
              title: "Would you like to save your changes?",
              buttonOptions: [
                { text: "Yes", onPress: submit },
                {
                  text: "No",
                  onPress: () => props.navigation.goBack(),
                  style: "destructive",
                },
              ],
            });
          else props.navigation.goBack();
        }}
      />
    ),
    headerRight: () => {
      return state.blockedUsers.length > 0 ? (
        <HeaderTextButton
          onPress={async () => {
            const dataChanged = !isEqual(
              state.originalBlockedUsers,
              state.blockedUsers
            );
            if (dataChanged) {
              await submit();
            } else props.navigation.goBack();
          }}
          title="Save"
        />
      ) : null;
    },
    gestureEnabled: isEqual(state.blockedUsers, state.originalBlockedUsers)
      ? true
      : false,
  });

  useEffect(() => {
    (async () => {
      getBlocklist();
    })();
  }, []);

  const getBlocklist = async (refresh?: boolean) => {
    if (refresh) {
      setLoadingState((loadingState) => ({
        ...loadingState,
        refreshingLoading: true,
      }));
    }
    const response = await request({
      url: "/user/settings/blocklist",
      method: "GET",
    });

    setLoadingState((loadingState) => {
      return refresh
        ? { ...loadingState, refreshingLoading: false }
        : { ...loadingState, initLoading: false };
    });

    if (!response.ok) return setError(true);

    const blockedUsers: { username: string }[] = response.data.blockedUsers;
    const blockedUsersWithExtraProps = blockedUsers.map((u) => ({
      ...u,
      blocked: true,
    }));
    const originalBlockedUsersWithExtraProps = cloneDeep(
      blockedUsersWithExtraProps
    );
    setState({
      ...state,
      blockedUsers: blockedUsersWithExtraProps,
      originalBlockedUsers: originalBlockedUsersWithExtraProps,
    });
  };

  const pushToProfile = (username: string) => {
    props.navigation.push("UneditableProfile", { username });
  };

  const submit = async () => {
    const { blockedUsers, originalBlockedUsers } = state;

    if (isEqual(blockedUsers, originalBlockedUsers)) return;
    setLoadingState((loadingState) => ({
      ...loadingState,
      uploadLoading: true,
    }));
    const response = await request({
      url: "/user/settings/blocklist",
      method: "PUT",
      body: { blockedUsers },
    });
    setLoadingState((loadingState) => ({
      ...loadingState,
      uploadLoading: false,
    }));
    if (response.ok) {
      props.navigation.goBack();
      showBanner({
        message: "Your block list has been successfully updated.",
        type: "success",
      });
      setState({ ...state, originalBlockedUsers: blockedUsers });
      return;
    } else {
      showBanner({ message: "An error occurred.", type: "danger" });
      return;
    }
  };

  return (
    <ParentView noScroll noHorizontalPadding safeBottomInset>
      <View style={{ flex: 1 }}>
        {loadingState.initLoading ? (
          <LoadingIndicator />
        ) : error ? (
          <Text
            a="center"
            style={{ marginTop: 50, marginHorizontal: 20 }}
            w="bold"
          >
            An error occurred while trying to load settings. Please try again.
          </Text>
        ) : (
          <>
            <View style={{ marginHorizontal: defaultHorizontalInset }}>
              <Text s="header" w="bold">
                Block List
              </Text>
              <Text w="semiBold" style={{ marginBottom: 20 }}>
                {blockedUsers.filter((u) => u.blocked && u).length} blocked
                people
              </Text>
            </View>
            <FlatList
              style={{ flex: 1 }}
              data={state.blockedUsers}
              keyExtractor={(item, index) => index.toString()}
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              onRefresh={() => getBlocklist(true)}
              refreshing={loadingState.refreshingLoading}
              ListEmptyComponent={
                <Text s="xl" a="center" w="bold" style={{ marginTop: 40 }}>
                  Nobody is in your block list yet.
                </Text>
              }
              renderItem={({ item, index }) => (
                <BlockListItem
                  {...item}
                  onToggle={onToggle}
                  pushToProfile={pushToProfile}
                  lastItem={index === state.blockedUsers.length - 1}
                />
              )}
            />
          </>
        )}
      </View>
    </ParentView>
  );
};

interface BlockedListItemProps extends BlockedUser {
  onToggle: (username: string) => void;
  pushToProfile: (username: string) => void;
  lastItem: boolean;
}

const BlockListItem = ({
  username,
  blocked,
  onToggle,
  lastItem,
  pushToProfile,
}: BlockedListItemProps) => {
  const { borderColor } = useContext(ThemeContext);
  return (
    <View
      style={{
        padding: 20,
        marginHorizontal: defaultHorizontalInset,
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: lastItem ? 0 : StyleSheet.hairlineWidth,
        borderColor,
      }}
    >
      <TouchableOpacity onPress={() => pushToProfile(username)}>
        <Text w="semiBold">{username}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onToggle(username)}>
        {blocked ? (
          <Text t="muted" w="semiBold">
            Unblock
          </Text>
        ) : (
          <Text t="error" w="semiBold">
            Block
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default BlockList;
