import React, { useContext, useState } from "react";
import NativeAdView, {
  IconView,
  HeadlineView,
  TaglineView,
  AdvertiserView,
  ImageView,
} from "react-native-admob-native-ads";
import { View, TouchableOpacity, Platform, ViewStyle } from "react-native";
import { ENV } from "../../../env";

import { errorColor, tintColor } from "../../constants";
import { ThemeContext } from "../../contexts";
import {
  AMPLITUDE_TRANSACTIONAL_EVENTS,
  amplitudeTrack,
  randomNumberFromRange,
} from "../../utils";
import { AdMobBanner } from "react-native-admob";
import { Icon, Text } from "../Primitives";

const numLikes = randomNumberFromRange(1000);

const PostAd = ({ style }: { style?: ViewStyle }) => {
  const [state, setState] = useState({
    customAdLoaded: false,
    customAdFailed: false,
    bannerAdLoaded: false,
    bannerAdFailed: false,
  });
  const { textColor } = useContext(ThemeContext);
  if (state.bannerAdFailed) return <></>;
  if (state.customAdFailed || Platform.OS === "android") {
    return (
      <AdMobBanner
        style={style}
        adSize="largeBanner"
        adUnitID={
          Platform.OS === "ios"
            ? ENV.ADMOB_AD_UNIT_ID_IOS_LIVE_STREAM_BANNER_AD
            : ENV.ADMOB_AD_UNIT_ID_ANDROID_LIVE_STREAM_BANNER_AD
        }
        testDevices={[AdMobBanner.simulatorId]}
        onAdFailedToLoad={(error) => {
          amplitudeTrack(AMPLITUDE_TRANSACTIONAL_EVENTS.ad_failed, {
            errorMessage: error.message,
            adName:
              Platform.OS === "ios"
                ? "ADMOB_AD_UNIT_ID_IOS_LIVE_STREAM_BANNER_AD"
                : "ADMOB_AD_UNIT_ID_ANDROID_LIVE_STREAM_BANNER_AD",
          });
          setState({ ...state, bannerAdFailed: true });
        }}
        onAdLoaded={() => setState({ ...state, bannerAdLoaded: true })}
      />
    );
  }
  return (
    <NativeAdView
      onAdLoaded={() => {
        setState({ ...state, customAdLoaded: true });
      }}
      onAdFailedToLoad={({ error }) => {
        setState({ ...state, customAdFailed: true });
        amplitudeTrack(AMPLITUDE_TRANSACTIONAL_EVENTS.ad_failed, {
          errorMessage: error.message,
          adName:
            Platform.OS === "ios"
              ? "ADMOB_AD_UNIT_ID_IOS_LIVE_STREAM_THUMBNAIL_AD"
              : "ADMOB_AD_UNIT_ID_ANDROID_LIVE_STREAM_THUMBNAIL_AD",
        });
      }}
      onAdClicked={() => {
        amplitudeTrack(AMPLITUDE_TRANSACTIONAL_EVENTS.ad_clicked);
      }}
      onAdImpression={() => {
        amplitudeTrack(AMPLITUDE_TRANSACTIONAL_EVENTS.ad_impression);
      }}
      style={{ paddingVertical: 15 }}
      // enableTestMode
      adUnitID={
        Platform.OS === "ios"
          ? ENV.ADMOB_AD_UNIT_ID_IOS_LIVE_STREAM_THUMBNAIL_AD
          : ENV.ADMOB_AD_UNIT_ID_ANDROID_LIVE_STREAM_THUMBNAIL_AD
      }
      testDevices={[""]}
    >
      <>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 15,
            paddingHorizontal: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <IconView style={{ width: 35, height: 35, borderRadius: 35 }} />
            <View style={{ marginLeft: 10 }}>
              <HeadlineView
                ellipsizeMode="tail"
                numberOfLines={1}
                style={{
                  fontFamily: "Muli-SemiBold",
                  fontSize: 18,
                  color: textColor,
                  marginRight: 40,
                }}
              />
              <AdvertiserView
                ellipsizeMode="tail"
                numberOfLines={1}
                style={{ fontFamily: "Muli", fontSize: 14, color: textColor }}
              />
            </View>
          </View>
        </View>
        <View style={{ marginBottom: 5, maxHeight: 200 }}>
          <ImageView
            style={{
              height: "100%",
              resizeMode: "contain",
              position: "relative",
            }}
          />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Icon
              library="ionicons"
              name={`md-heart`}
              size={32}
              color={tintColor}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingHorizontal: 5, paddingVertical: 5, flex: 1 }}
          >
            <Text s="lg" w="bold">
              {numLikes} likes
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginVertical: 10, paddingHorizontal: 10 }}>
          <TaglineView
            ellipsizeMode="tail"
            numberOfLines={2}
            allowFontScaling={false}
            style={{ fontFamily: "Muli", fontSize: 14, color: textColor }}
          />
        </View>
        <View style={{ marginVertical: 10, paddingHorizontal: 10 }}>
          <Text s="xs">Sponsored</Text>
        </View>
      </>
    </NativeAdView>
  );
};

export default PostAd;
