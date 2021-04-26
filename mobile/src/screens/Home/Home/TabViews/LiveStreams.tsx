import {
  PaginationState,
  defaultPaginationState,
  PermissionType,
} from "../../../../utils";
import { FlatList, Image, RefreshControl, View, Platform } from "react-native";
import {
  SocketContext,
  StreamContext,
  ThemeContext,
} from "../../../../contexts";
import {
  LiveStreamThumbnail,
  LiveStreamThumbnailPlaceholder,
  Text,
  LoadingIndicator,
  PermissionsSlideUp,
} from "../../../../components";
import React, { useContext, useEffect, useState } from "react";
import { bottomTabBarOffset } from "../../../../constants";

import ENV from "../../../../../env";
import { useRequest, useSlideUp } from "../../../../hooks";
import { watchStreams } from "../../../../assets";
import { AdMobInterstitial } from "react-native-admob";
import { PushToProfile, RemoveStream, PushToStream } from "../types";
import usePermissionStatus from "../../../../hooks/usePermissionStatus";
import { useScrollToTop } from "@react-navigation/native";

interface Stream {
  deviceId: string;
  streamTitle: string;
  avatar: string;
  username: string;
  thumbnail: string;
  upvote: number;
  downvote: number;
  numViewers: number;
  isFollowing: boolean;
}
interface Props {
  pushToProfile: PushToProfile;
  pushToStream: PushToStream;
}

interface State extends PaginationState {
  focusedIndex: number;
  streams: Stream[];
}

const initialState: State = {
  ...defaultPaginationState,
  streams: [],
  focusedIndex: 0,
};

const LiveStreams = (props: Props) => {
  const streamContext = useContext(StreamContext);
  const socketContext = useContext(SocketContext);
  const { borderColor, textColor } = useContext(ThemeContext);
  const [state, setState] = useState(initialState);
  const [request] = useRequest();
  const ref = React.useRef(null);
  useScrollToTop(ref);

  const [permissionsState, refreshPermissionStatus] = usePermissionStatus([
    "camera",
    "microphone",
  ]);
  const [permissionsRef, onOpenPermissions, onClosePermissions] = useSlideUp();

  useEffect(() => {
    (async () => {
      socketContext.startSocket();
      await initLoad();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        AdMobInterstitial.setAdUnitID(
          Platform.select({
            ios: ENV.ADMOB_AD_UNIT_ID_IOS_BEFORE_VIEW_LIVE_STREAM_INTERSTITIAL,
            android:
              ENV.ADMOB_AD_UNIT_ID_ANDROID_BEFORE_VIEW_LIVE_STREAM_INTERSTITIAL,
            default: "",
          })
        );
        await AdMobInterstitial.requestAd();
      } catch (err) {}
    })();
  }, []);

  useEffect(() => {
    if (socketContext?.state?.authenticated) {
      streamContext.initStreamSocketEvents();
    }
  }, [socketContext?.state?.authenticated]);

  const initLoad = async () => {
    const response = await getStreams({
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState({
        ...state,
        streams: response.data.streams,
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        initLoading: false,
      });
    } else {
      return setState({ ...state, initLoading: false });
    }
  };

  const paginate = async () => {
    if (state.reachedEnd || state.paginationLoading) return;
    setState({ ...state, paginationLoading: true });
    const response = await getStreams({
      page: state.page,
      pageSize: state.pageSize,
    });
    if (response.ok) {
      return setState(({ streams }) => ({
        ...state,
        streams: [...streams, ...response.data.streams],
        page: response.data.page + 1,
        reachedEnd: response.data.reachedEnd,
        paginationLoading: false,
      }));
    } else setState({ ...state, paginationLoading: false });
  };

  const getStreams = async (params: { page: number; pageSize: number }) => {
    return request({
      url: "/user/streams/",
      method: "GET",
      params,
    });
  };

  const refresh = async () => {
    setState((state) => ({ ...state, refreshing: true }));
    const response = await getStreams({ page: 1, pageSize: state.pageSize });
    if (response.ok) {
      setState((state) => ({
        ...state,
        page: response.data.page + 1,
        streams: response.data.streams,
        reachedEnd: response.data.reachedEnd,
        refreshing: false,
      }));
    } else {
      setState((state) => ({ ...state, refreshing: false }));
    }
  };

  const ListEmptyComponent = () => (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
      }}
    >
      <Image
        source={watchStreams}
        style={{ width: 350, height: 350, resizeMode: "contain" }}
      />
      <Text style={{ marginTop: 40 }} s="lg" w="bold">
        Sorry, we couldn't find any streams right now. Swipe down to refresh!
      </Text>
    </View>
  );

  const PlaceholderComponent = () => (
    <View
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingTop: 60,
      }}
    >
      <LiveStreamThumbnailPlaceholder />
      <LiveStreamThumbnailPlaceholder />
    </View>
  );

  const ListFooterComponent = () => {
    if (state.paginationLoading) {
      return <LoadingIndicator style={{ marginBottom: 40 }} />;
    }
    if (state.reachedEnd && state.streams.length > 0) {
      return (
        <Text
          a="center"
          w="bold"
          style={{ marginBottom: bottomTabBarOffset + 50 }}
        >
          You've reached the 🔚
        </Text>
      );
    }
  };

  const RefreshControlComponent = () => {
    return (
      <RefreshControl
        refreshing={state.refreshing}
        onRefresh={refresh}
        tintColor={textColor}
      />
    );
  };

  const removeStream: RemoveStream = (removeDeviceId) => {
    const streamsCopy = state.streams;
    const index = streamsCopy.findIndex(
      ({ deviceId }) => deviceId === removeDeviceId
    );
    streamsCopy.splice(index, 1);
    setState((state) => ({ ...state, streams: streamsCopy }));
  };

  const pushToStreamOverride = async (deviceId: string, index?: number) => {
    if (permissionsState.allStatuses === "granted") {
      if (Math.random() < 0.33) {
        AdMobInterstitial.isReady(async (ready) => {
          if (ready) {
            const cleanupAd = async () => {
              props.pushToStream({ deviceId, index, removeStream });
              AdMobInterstitial.removeAllListeners();
              await AdMobInterstitial.requestAd();
            };
            AdMobInterstitial.removeAllListeners();
            AdMobInterstitial.addEventListener("adClosed", async () =>
              cleanupAd()
            );
            AdMobInterstitial.addEventListener("adFailedToLoad", async () =>
              cleanupAd()
            );
            AdMobInterstitial.addEventListener("adLeftApplication", async () =>
              cleanupAd()
            );
            await AdMobInterstitial.showAd();
          } else props.pushToStream({ deviceId, index, removeStream });
        });
      } else props.pushToStream({ deviceId, index, removeStream });
      AdMobInterstitial.removeAllListeners();
    } else {
      onOpenPermissions();
    }
  };

  return (
    <>
      {state.initLoading ? (
        PlaceholderComponent()
      ) : (
        <FlatList
          ref={ref}
          contentContainerStyle={{
            justifyContent: "center",
            alignItems: "center",
            borderColor,
            paddingTop: 20,
            paddingBottom: bottomTabBarOffset,
          }}
          data={state.streams}
          initialNumToRender={3}
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={5}
          keyExtractor={(_, index: number) => index.toString()}
          refreshControl={RefreshControlComponent()}
          ListEmptyComponent={ListEmptyComponent()}
          ListFooterComponent={ListFooterComponent()}
          onEndReachedThreshold={0.4}
          onEndReached={paginate}
          renderItem={({ item, index }) => (
            <LiveStreamThumbnail
              {...item}
              index={index}
              onPressProfile={props.pushToProfile}
              onPress={pushToStreamOverride}
              onBlockSubmit={removeStream}
              onReportSubmit={removeStream}
              activeOpacity={0.5}
              showAd={index % 10 === 0 && index > 0}
            />
          )}
        />
      )}
      <PermissionsSlideUp
        ref={permissionsRef}
        onPressX={onClosePermissions}
        permissionsState={permissionsState}
        refreshPermissionStatus={refreshPermissionStatus}
        onAllPermissionsGrantedCallback={onClosePermissions}
      />
    </>
  );
};

export default LiveStreams;
