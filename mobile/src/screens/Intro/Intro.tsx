import {
  AMPLITUDE_LIFETIME_EVENTS,
  amplitudeTrack,
  readCache,
  writeCachePermanent,
} from "../../utils";
import { Text, Button } from "../../components";
import { Image, ScrollView, View, ViewToken, FlatList } from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  eatWithNewPeople,
  streamYourself,
  watchLiveStreams,
} from "../../assets";
import { window } from "../../constants";

import { GlobalContext, ThemeContext } from "../../contexts";
import { getUniqueId } from "react-native-device-info";
import { isIphoneX } from "../../constants/statusBar";
import CarouselDots from "../../components/Carousels/CarouselDots";
import {
  ViewableItemsChangedRef,
  viewabilityConfig,
  ViewabilityConfig,
} from "../../components/Carousels/types";

const slides = [
  {
    title: "Eat",
    text: `Never eat alone. \n\nHop on a video call and eat with someone new.`,
    image: eatWithNewPeople,
  },
  {
    title: "Watch",
    text: `Join other people's food live streams and be part of the conversation!`,
    image: watchLiveStreams,
  },
  {
    title: "Stream",
    text: `Start your own stream, build an audience, and connect with even more people around the world.`,
    image: streamYourself,
  },
];

const Intro = () => {
  const { backgroundColor } = useContext(ThemeContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const global = useContext(GlobalContext);
  const flatListRef: any = useRef(null);

  const viewableItemsChangedRef: ViewableItemsChangedRef = useRef((info) => {
    const currentIndex = info?.viewableItems[0]?.index;
    if (currentIndex !== null) {
      setCurrentIndex(currentIndex);
    }
  });

  const viewabilityConfigRef: React.Ref<ViewabilityConfig> = useRef(
    viewabilityConfig
  );

  useEffect(() => {
    (async () => {
      const seenIntro = await readCache("seenIntro");
      if (!seenIntro) {
        amplitudeTrack(AMPLITUDE_LIFETIME_EVENTS.init_download, {
          deviceId: getUniqueId(),
        });
      }
    })();
  }, []);

  const onPressNext = (currentIndex: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        animated: true,
        index: currentIndex + 1,
      });
    }
  };

  const onPressDone = async () => {
    global.setState({ seenIntro: true });
    await writeCachePermanent("seenIntro", true);
  };

  return (
    <View style={{ backgroundColor, flex: 1 }}>
      <ScrollView contentContainerStyle={{ flex: 1 }}>
        <FlatList
          horizontal
          ref={flatListRef}
          style={{ flex: 1 }}
          showsHorizontalScrollIndicator={false}
          snapToInterval={window.width}
          snapToAlignment="center"
          decelerationRate={0.9}
          keyExtractor={(_, index) => index.toString()}
          viewabilityConfig={viewabilityConfigRef.current}
          onViewableItemsChanged={viewableItemsChangedRef.current}
          data={slides}
          renderItem={({ item }) => (
            <View
              style={{
                flex: 1,
                width: window.width,
                alignItems: "center",
                paddingVertical: isIphoneX() ? "10%" : "5%",
                paddingHorizontal: 30,
              }}
            >
              <Text
                a="center"
                s="subHeader"
                w="bold"
                style={{ marginVertical: 20 }}
              >
                {item.title}
              </Text>
              <Image
                source={{ uri: item.image }}
                style={{
                  width: 300,
                  height: 400,
                  marginVertical: 10,
                  resizeMode: "stretch",
                  borderRadius: 20,
                  marginBottom: 10,
                }}
              />
              <Text
                a="center"
                w="semiBold"
                s="xl"
                style={{ marginVertical: 10 }}
              >
                {item.text}
              </Text>
            </View>
          )}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingBottom: 20,
          }}
        >
          <View style={{ flex: 1 }} />
          <View style={{ flex: 1 }}>
            <CarouselDots
              countDots={slides.length}
              currentIndex={currentIndex}
            />
          </View>
          <View style={{ flex: 1 }}>
            {slides.length - 1 === currentIndex ? (
              <Button
                title="Done"
                style={{
                  alignSelf: "flex-end",
                  width: 80,
                  height: 40,
                  marginRight: 20,
                  borderTopRightRadius: 8,
                  borderBottomLeftRadius: 8,
                }}
                onPress={onPressDone}
              />
            ) : (
              <Button
                title="Next"
                style={{
                  alignSelf: "flex-end",
                  width: 80,
                  height: 40,
                  marginRight: 20,
                  borderTopRightRadius: 8,
                  borderBottomLeftRadius: 8,
                }}
                onPress={() => onPressNext(currentIndex)}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Intro;
