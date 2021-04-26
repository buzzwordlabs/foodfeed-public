import React, { useState, useContext } from "react";
import { View, Platform, TextInput } from "react-native";
import { HeaderTextButton, ImagePostCarousel, Text } from "../../components";
import { HomeStackNavProps, CreateStackNavProps } from "../../navigation";
import * as Animatable from "react-native-animatable";
import { ThemeContext } from "../../contexts";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useLoadingRequest } from "../../hooks";
import * as mime from "react-native-mime-types";
import ImageResizer from "react-native-image-resizer";
import CarouselDots from "../../components/Carousels/CarouselDots";
import { window, muli, tintColor } from "../../constants";
import {
  ACCEPTED_RATIOS_STRING_ENUM,
  calculateDimensions,
  showBanner,
} from "../../utils";

type Props = CreateStackNavProps<"CreatePostFinalize">;

const ratio = ACCEPTED_RATIOS_STRING_ENUM[
  "7:8"
] as keyof typeof ACCEPTED_RATIOS_STRING_ENUM;

const { width, height } = calculateDimensions({
  width: window.width,
  ratio,
});

const CreatePostFinalize = (props: Props) => {
  const { uploadedMedia } = props.route.params;
  const [description, setDescription] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const { backgroundColor, textColor, themeName, borderColor } = useContext(
    ThemeContext
  );
  const [request, loading] = useLoadingRequest();

  props.navigation.setOptions({
    headerShown: true,
    title: "Create Post",
    headerRight: () => {
      return (
        <Animatable.View animation="fadeInRight" duration={500}>
          <HeaderTextButton title="Post" onPress={onSubmit} loading={loading} />
        </Animatable.View>
      );
    },
  });

  const onSubmit = async () => {
    const body = new FormData();

    await Promise.all(
      uploadedMedia.map(async (media, index) => {
        const image = await ImageResizer.createResizedImage(
          media.path,
          1680,
          1920,
          "JPEG",
          70
        );

        body.append("media", {
          name: `media_${index}`,
          type: mime.lookup(image.path),
          uri:
            Platform.OS === "ios"
              ? image.path.replace("ph://", "")
              : "file://" + image.path,
        });
      })
    );

    body.append("description", description);

    body.append("mediaSource", props.route.params.mediaSource);

    const response = await request({
      url: "user/posts",
      method: "POST",
      body,
      optionalHeaders: {
        timeout: 20000,
      },
    });

    if (response.ok) {
      props.navigation.popToTop();
      showBanner({ message: "Posted!", type: "success" });
    } else {
      showBanner({
        message: "Something went wrong. Please try again!",
        type: "danger",
      });
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor }}
      contentContainerStyle={{
        backgroundColor,
        paddingTop: 10,
        paddingBottom: 40,
      }}
      extraScrollHeight={100}
    >
      <View>
        <ImagePostCarousel
          images={uploadedMedia.map((m) => m.path)}
          onIndexChange={(currentIndex) => setCurrentIndex(currentIndex)}
          onPressDouble={() => {}}
          width={width}
          height={height}
          aspectRatio={ratio}
          imageType="image"
        />
        <View style={{ marginVertical: 10 }}>
          {uploadedMedia.length > 1 && (
            <CarouselDots
              countDots={uploadedMedia.length}
              currentIndex={currentIndex}
            />
          )}
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <Text w="bold">Caption</Text>
        <TextInput
          multiline
          value={description}
          style={{
            fontFamily: muli,
            color: textColor,
            fontSize: 14,
            textAlignVertical: "top",
            marginBottom: 10,
            minHeight: 100,
          }}
          maxLength={2000}
          scrollEnabled={false}
          autoCapitalize="sentences"
          onChangeText={(description) => setDescription(description)}
          allowFontScaling={false}
          selectionColor={tintColor}
          keyboardAppearance={themeName}
          placeholderTextColor="gray"
          placeholder="Check out this 🔥 meal!"
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 20,
            alignSelf: "flex-end",
            borderWidth: 1,
            borderColor,
            borderRadius: 6,
            paddingVertical: 4,
            paddingHorizontal: 8,
          }}
        >
          <Text s="sm" w="semiBold">
            {description.length}/2000
          </Text>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default CreatePostFinalize;
