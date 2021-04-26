import {
  BlockUserSlideUp,
  ReportUserSlideUp,
  SlideUp,
  SlideUpButton,
  SlideUpButtonBase,
  HelpFeedbackSlideUp,
} from "../SlideUp";
import { Icon, Text } from "../Primitives";
import {
  PlaceholderContainer,
  PlaceholderLine,
  PlaceholderMedia,
} from "../Placeholder";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import React, { useContext } from "react";
import { getRandomGif, truncateThousand, launchShare } from "../../utils";
import {
  shadowBox,
  window,
  fadedTintColor,
  successColor,
  errorColor,
  appName,
} from "../../constants";

import Avatar from "./Avatar";
import FastImage from "react-native-fast-image";
import LiveIndicator from "./LiveIndicator";
import { useSlideUp } from "../../hooks";
import { debounce } from "lodash";
import LiveStreamThumbnailAd from "../Ads/LiveStreamThumbnailAd";
import { ThemeContext } from "../../contexts";
import { RemoveStream } from "../../screens/Home/Home/types";

interface LiveStreamThumbnailProps {
  index: number;
  streamTitle: string;
  thumbnail: string;
  avatar: string;
  deviceId: string;
  upvote: number;
  downvote: number;
  numViewers: number;
  username: string;
  isFollowing: boolean;
  onPress: (deviceId: string, index: number) => Promise<any>;
  onPressProfile: (username: string) => any;
  onPressEllipsisCallback?: () => any;
  onBlockSubmit: RemoveStream;
  onReportSubmit: RemoveStream;
  style?: ViewStyle;
  hideEllipsis?: boolean;
  activeOpacity?: number;
  indicateIfPlaceholder?: boolean;
  showAd?: boolean;
}

export const thumbnailContainerDimensions = {
  width: window.width - 24,
  height: 300,
};

const LiveStreamThumbnail = React.memo((props: LiveStreamThumbnailProps) => {
  const { liftedBackgroundColor, textColor } = useContext(ThemeContext);

  const [
    liveStreamOptionsRef,
    openLiveStreamOptionsSlideUp,
    closeLiveStreamOptionsSlideUp,
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
  const [
    helpFeedbackSlideUp,
    openHelpFeedbackSlideUp,
    closeHelpFeedbackSlideUp,
  ] = useSlideUp();

  const {
    index,
    username,
    avatar,
    thumbnail,
    streamTitle,
    upvote,
    downvote,
    numViewers,
    hideEllipsis,
    activeOpacity,
    indicateIfPlaceholder,
    style,
    deviceId,
    onPress,
    onPressProfile,
    onPressEllipsisCallback,
    showAd,
    isFollowing,
    onBlockSubmit,
    onReportSubmit,
  } = props;

  const debouncedOnPress = debounce(async () => onPress(deviceId, index), 500, {
    leading: false,
    trailing: true,
  });

  const debouncedOnPressEllipsisCallback = onPressEllipsisCallback
    ? debounce(() => onPressEllipsisCallback(), 500)
    : () => {};

  const debouncedOnPressProfile = onPressProfile
    ? debounce(() => onPressProfile(username), 500)
    : () => {};

  const borderRadius = 10;
  return (
    <>
      <View
        style={[
          {
            ...thumbnailContainerDimensions,
            marginBottom: 40,
            borderRadius,
            ...shadowBox,
          },
          style,
        ]}
      >
        <LiveIndicator
          style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}
        />
        <TouchableOpacity
          onPress={debouncedOnPress}
          onLongPress={openLiveStreamOptionsSlideUp}
          style={{
            flex: 1,
            backgroundColor: liftedBackgroundColor,
            borderRadius,
          }}
          activeOpacity={activeOpacity}
        >
          <View style={{ flex: 1 }}>
            {!thumbnail && indicateIfPlaceholder && (
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  borderTopLeftRadius: borderRadius,
                  borderTopRightRadius: borderRadius,
                  zIndex: 2,
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.3)",
                }}
              >
                <Text a="center" w="bold" s="xxl">
                  Thumbnail Placeholder
                </Text>
              </View>
            )}
            <FastImage
              style={{
                flex: 1,
                borderTopLeftRadius: borderRadius,
                borderTopRightRadius: borderRadius,
              }}
              source={{ uri: thumbnail || getRandomGif() }}
              resizeMode="cover"
            />
          </View>
          <View style={{ paddingVertical: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingLeft: 10,
              }}
            >
              <TouchableOpacity onPress={debouncedOnPressProfile}>
                <Avatar avatar={avatar} style={{ width: 35, height: 35 }} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 10, marginRight: 10 }}>
                <Text
                  s="lg"
                  w="semiBold"
                  ellipsizeMode="tail"
                  numberOfLines={1}
                >
                  {streamTitle}
                </Text>
                <Text ellipsizeMode="tail" numberOfLines={1}>
                  {username}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingLeft: 10,
              }}
            >
              <View style={{ flexDirection: "row", marginTop: 10 }}>
                <View
                  style={{
                    flexDirection: "row",
                    paddingRight: 10,
                    alignItems: "center",
                  }}
                >
                  <Icon
                    style={{ marginRight: 5 }}
                    library="ionicons"
                    name={`${Platform.OS === "ios" ? "ios" : "md"}-eye`}
                    size={16}
                    color={textColor}
                  />
                  <View>
                    <Text w="bold" s="sm" a="center">
                      {truncateThousand(numViewers)}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: 10,
                    alignItems: "center",
                  }}
                >
                  <Icon
                    style={{ marginRight: 5 }}
                    library="ionicons"
                    name={`${Platform.OS === "ios" ? "ios" : "md"}-thumbs-up`}
                    color={successColor}
                    size={18}
                  />
                  <View>
                    <Text w="bold" s="sm" a="center">
                      {truncateThousand(upvote)}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: 10,
                    alignItems: "center",
                  }}
                >
                  <Icon
                    style={{ marginRight: 5 }}
                    library="ionicons"
                    name={`${Platform.OS === "ios" ? "ios" : "md"}-thumbs-down`}
                    color={errorColor}
                    size={18}
                  />
                  <View>
                    <Text w="bold" s="sm" a="center">
                      {truncateThousand(downvote)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: "row" }}>
                {isFollowing && (
                  <View
                    style={{
                      marginHorizontal: 10,
                      paddingVertical: 5,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                      backgroundColor: isFollowing
                        ? fadedTintColor
                        : "transparent",
                      alignSelf: "center",
                    }}
                  >
                    <Text>Following</Text>
                  </View>
                )}
                {!hideEllipsis && (
                  <TouchableOpacity
                    onPress={() => {
                      openLiveStreamOptionsSlideUp();
                      debouncedOnPressEllipsisCallback();
                    }}
                    style={{ marginRight: 5 }}
                  >
                    <Icon
                      library="materialComIcons"
                      name="dots-horizontal"
                      size={32}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <SlideUp ref={liveStreamOptionsRef} withHandle={false}>
          <SlideUpButtonBase
            title={username}
            IconComponent={
              <Avatar style={{ width: 25, height: 25 }} avatar={avatar} />
            }
            onPress={() => {
              debouncedOnPressProfile();
              closeLiveStreamOptionsSlideUp();
            }}
          />
          <SlideUpButton
            type="watch"
            title="Watch Stream"
            onPress={async () => {
              await debouncedOnPress();
              closeLiveStreamOptionsSlideUp();
            }}
          />
          <SlideUpButton
            type="share"
            title="Share Stream"
            onPress={async () => {
              await launchShare({
                type: "toViewLiveStream",
                title: "FoodFeed LiveStream",
                message: `Check out this live stream on ${appName}!`,
                deepLinkArgs: { deviceId },
              });
              closeLiveStreamOptionsSlideUp();
            }}
          />
          <SlideUpButton
            type="block"
            onPress={openBlockUserSlideUp}
            title={`Block ${username}`}
          />
          <SlideUpButton
            type="report"
            onPress={openReportUserSlideUp}
            title={`Report ${username}`}
          />
          <SlideUpButton
            type="help_feedback"
            title="Help or Feedback"
            onPress={() => {
              closeLiveStreamOptionsSlideUp();
              openHelpFeedbackSlideUp();
            }}
          />
          <SlideUpButton type="close" onPress={closeLiveStreamOptionsSlideUp} />
        </SlideUp>
        <HelpFeedbackSlideUp
          ref={helpFeedbackSlideUp}
          onCancel={closeHelpFeedbackSlideUp}
          onSubmit={closeHelpFeedbackSlideUp}
        />
        <ReportUserSlideUp
          ref={reportUserRef}
          onCancel={closeReportUserSlideUp}
          onSubmit={() => {
            closeReportUserSlideUp();
            onReportSubmit(deviceId);
          }}
          reportData={{ deviceId }}
          type="viewer-reports-streamer"
          username={username}
        />
        <BlockUserSlideUp
          ref={blockUserRef}
          onCancel={closeBlockUserSlideUp}
          onSubmit={() => {
            closeBlockUserSlideUp();
            onBlockSubmit(deviceId);
          }}
          username={username}
        />
      </View>
      {showAd && (
        <View style={{ alignItems: "center" }}>
          <LiveStreamThumbnailAd
            style={{ marginBottom: 40 }}
            thumbnailContainerDimensions={thumbnailContainerDimensions}
          />
        </View>
      )}
    </>
  );
});

const LiveStreamThumbnailPlaceholder = () => {
  const { liftedBackgroundColor } = useContext(ThemeContext);
  return (
    <PlaceholderContainer
      style={{
        ...thumbnailContainerDimensions,
        marginBottom: 40,
        ...shadowBox,
      }}
    >
      <PlaceholderMedia
        style={{
          width: thumbnailContainerDimensions.width,
          height: thumbnailContainerDimensions.height - 50,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      />
      <PlaceholderContainer
        Left={() => <PlaceholderMedia isRound style={{ marginRight: 10 }} />}
        style={{
          padding: 10,
          backgroundColor: liftedBackgroundColor,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
          width: thumbnailContainerDimensions.width,
        }}
      >
        <PlaceholderLine width={70} />
        <PlaceholderLine width={30} />
      </PlaceholderContainer>
    </PlaceholderContainer>
  );
};

export { LiveStreamThumbnail, LiveStreamThumbnailPlaceholder };
