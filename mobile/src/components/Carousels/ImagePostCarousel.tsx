import React, { useRef } from "react";
import { FlatList, ViewStyle, Image, ViewabilityConfig } from "react-native";
import FastImage from "react-native-fast-image";
import { DoubleTap } from "../Primitives";
import {
  ACCEPTED_RATIOS_STRING_ENUM,
  resolveRatioStringToNumber,
} from "../../utils";
import { viewabilityConfig, ViewableItemsChangedRef } from "./types";
import { RemoteImageMedia } from "../Posts";

type ImageType = "image" | "fastImage";

export interface ImagePostCarouselProps {
  images: string[];
  onPressDouble?: () => void;
  containerStyle?: ViewStyle;
  onIndexChange: (newIndex: number) => void;
  width: number;
  height: number;
  aspectRatio: keyof typeof ACCEPTED_RATIOS_STRING_ENUM;
  imageType: ImageType;
}

const ImagePostCarousel = React.memo((props: ImagePostCarouselProps) => {
  const viewableItemsChangedRef: ViewableItemsChangedRef = useRef((info) => {
    const currentIndex = info?.viewableItems[0]?.index;
    if (currentIndex !== null) {
      props.onIndexChange(currentIndex ?? 0);
    }
  });

  const viewabilityConfigRef: React.Ref<ViewabilityConfig> = useRef(
    viewabilityConfig
  );

  return props.images.length > 1 ? (
    <FlatList
      horizontal
      style={{ height: props.height }}
      showsHorizontalScrollIndicator={false}
      snapToInterval={props.width}
      snapToAlignment="center"
      decelerationRate={0.8}
      keyExtractor={(_, index) => index.toString()}
      viewabilityConfig={viewabilityConfigRef.current}
      onViewableItemsChanged={viewableItemsChangedRef.current}
      data={props.images}
      renderItem={({ item, index }) => (
        <Slide
          onPressDouble={props.onPressDouble || (() => {})}
          index={index}
          width={props.width}
          height={props.height}
          aspectRatio={props.aspectRatio}
          uri={item}
          imageType={props.imageType}
        />
      )}
    />
  ) : (
    <Slide
      onPressDouble={props.onPressDouble || (() => {})}
      index={0}
      width={props.width}
      height={props.height}
      aspectRatio={props.aspectRatio}
      uri={props.images[0]}
      imageType={props.imageType}
    />
  );
});

interface SlideProps
  extends Pick<
    ImagePostCarouselProps,
    "onPressDouble" | "aspectRatio" | "width" | "height"
  > {
  imageType: ImageType;
  uri: string;
  index: number;
}

const Slide = (props: SlideProps) => {
  return (
    <DoubleTap
      onPressDouble={props.onPressDouble || (() => {})}
      touchableOpacityProps={{ activeOpacity: 1 }}
      delay={300}
    >
      {props.imageType === "fastImage" ? (
        <RemoteImageMedia
          uri={props.uri}
          height={props.height}
          width={props.width}
          aspectRatio={props.aspectRatio}
        />
      ) : (
        <Image
          style={{
            width: props.width,
            height: props.height,
            aspectRatio: resolveRatioStringToNumber(props.aspectRatio),
            resizeMode: "cover",
          }}
          source={{ uri: props.uri }}
        />
      )}
    </DoubleTap>
  );
};

export default ImagePostCarousel;
