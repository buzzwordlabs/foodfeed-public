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
import { shadowBox } from "../../constants";
import LiveIndicator from "../Miscellaneous/LiveIndicator";
import { ThemeContext } from "../../contexts";
import { AMPLITUDE_TRANSACTIONAL_EVENTS, amplitudeTrack } from "../../utils";
import { AdMobBanner } from "react-native-admob";

const LiveStreamThumbnailAd = (props: {
  style?: ViewStyle;
  thumbnailContainerDimensions: { width: number; height: number };
}) => {
  const [state, setState] = useState({
    customAdLoaded: false,
    customAdFailed: false,
    bannerAdLoaded: false,
    bannerAdFailed: false,
  });
  const { textColor, liftedBackgroundColor } = useContext(ThemeContext);
  if (state.bannerAdFailed) return <></>;
  if (state.customAdFailed || Platform.OS === "android") {
    return (
      <AdMobBanner
        style={props.style}
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
    <TouchableOpacity
      style={[
        {
          borderRadius: 10,
          backgroundColor: liftedBackgroundColor,
          ...shadowBox,
          ...props.thumbnailContainerDimensions,
        },
        props.style,
      ]}
    >
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
        style={{ flex: 1 }}
        // enableTestMode
        adUnitID={
          Platform.OS === "ios"
            ? ENV.ADMOB_AD_UNIT_ID_IOS_LIVE_STREAM_THUMBNAIL_AD
            : ENV.ADMOB_AD_UNIT_ID_ANDROID_LIVE_STREAM_THUMBNAIL_AD
        }
        testDevices={[""]}
      >
        <View style={{ flex: 1 }}>
          <LiveIndicator
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 10000000,
            }}
            title="AD"
          />
          <View style={{ flex: 1 }}>
            <ImageView
              style={{
                flex: 1,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                resizeMode: "cover",
                position: "relative",
              }}
            />
          </View>
          <View style={{ padding: 10, justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row" }}>
              <View style={{ marginRight: 10 }}>
                <IconView style={{ width: 35, height: 35, borderRadius: 35 }} />
              </View>
              <View>
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
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <TaglineView
                ellipsizeMode="tail"
                numberOfLines={2}
                allowFontScaling={false}
                style={{ fontFamily: "Muli", fontSize: 14, color: textColor }}
              />
            </View>
          </View>
        </View>
      </NativeAdView>
    </TouchableOpacity>
  );
};

export default LiveStreamThumbnailAd;
