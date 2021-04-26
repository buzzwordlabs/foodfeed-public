import React, { useState, useContext } from "react";
import FastImage from "react-native-fast-image";
import { ImagePostCarouselProps } from "../Carousels/ImagePostCarousel";
import { resolveRatioStringToNumber } from "../../utils";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { tintColor } from "../../constants";
import { ThemeContext } from "../../contexts";

interface RemoteImageMediaProps
  extends Pick<ImagePostCarouselProps, "width" | "height" | "aspectRatio"> {
  uri: string;
}

const RemoteImageMedia = (props: RemoteImageMediaProps) => {
  const { liftedBackgroundColor } = useContext(ThemeContext);
  const [progress, setProgress] = useState(100);
  return (
    <View>
      <FastImage
        style={{
          width: props.width,
          height: props.height,
          aspectRatio: resolveRatioStringToNumber(props.aspectRatio),
        }}
        source={{ uri: props.uri }}
        resizeMode="cover"
        onProgress={(progress) => {
          setProgress(progress.nativeEvent.loaded / progress.nativeEvent.total);
        }}
        onLoad={() => setProgress(100)}
      />
      {!(progress > 99) && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            width: props.width,
            height: props.height,
            backgroundColor: liftedBackgroundColor,
            justifyContent: "center",
          }}
        >
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
};

export default RemoteImageMedia;
