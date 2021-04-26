import {
  Button,
  GoBackButton,
  LiveStreamThumbnail,
  ParentView,
  SlideUp,
  SlideUpButton,
  Text,
  TextButton,
  Icon,
  PermissionsSlideUp,
  HelpFeedbackSlideUp,
} from "../../components";
import { GlobalContext, StreamContext, ThemeContext } from "../../contexts";
import ImagePicker, {
  Options as ImagePickerOptions,
  Image as ImagePickerResult,
} from "react-native-image-crop-picker";
import { Keyboard, Platform, TextInput, View } from "react-native";
import React, { useContext, useState, useEffect, memo } from "react";
import {
  getRandomQuirkyPhrase,
  numberWithCommas,
  showBanner,
  deviceId,
  launchShare,
  cleanOutgoingText,
} from "../../utils";
import {
  gradientColors,
  statusBarHeight,
  window,
  appName,
  tintColor,
} from "../../constants";
import {
  useLoadingRequest,
  useSlideUp,
  usePermissionStatus,
} from "../../hooks";

import { CreateStackNavProps } from "../../navigation";
import { useIsFocused } from "@react-navigation/native";

const quirkyPhrase = getRandomQuirkyPhrase();

type Props = CreateStackNavProps<"CreateLiveStream">;
interface State {
  title: string;
  thumbnailFile: ImagePickerResult;
  showThumbnailUpload: boolean;
}

const initialState: State = {
  title: "",
  thumbnailFile: (null as unknown) as ImagePickerResult,
  showThumbnailUpload: false,
};

const CreateLiveStream = memo((props: Props) => {
  const [state, setState] = useState(initialState);
  const streamContext = useContext(StreamContext);
  const global = useContext(GlobalContext);
  const { backgroundColor, textColor } = useContext(ThemeContext);
  const [request, loading] = useLoadingRequest();
  const canGoBack = props.route?.params?.canGoBack;
  const [permissionsState, refreshPermissionStatus] = usePermissionStatus([
    "camera",
    "microphone",
    "storage",
  ]);

  const [uploadImageRef, onOpenUploadImage, onCloseUploadImage] = useSlideUp();
  const [
    helpFeedbackSlideUp,
    openHelpFeedbackSlideUp,
    closeHelpFeedbackSlideUp,
  ] = useSlideUp();
  const [permissionsRef, onOpenPermissions, onClosePermissions] = useSlideUp();

  const submitTitle = () => {
    const { title } = state;
    // @ts-ignore
    const [cleanedText, errorReason] = cleanOutgoingText({
      text: title,
      restrictProfane: true,
      minimumLength: 2,
    });
    if (errorReason === "too_short") {
      return showBanner({
        message: "Live stream name must be longer than 2 characters.",
        type: "danger",
      });
    } else if (errorReason === "bad_words") {
      return showBanner({
        message: "Live stream name cannot contain profanity.",
        type: "danger",
      });
    } else setState({ ...state, showThumbnailUpload: true });
  };

  const imageUploadOptions: ImagePickerOptions = {
    width: 500,
    height: 350,
    cropping: true,
    multiple: false,
    compressImageMaxWidth: 500,
    compressImageMaxHeight: 350,
    compressImageQuality: 0.6,
    loadingLabelText: "Flipping the pancakes...",
    forceJpg: true,
    mediaType: "photo",
  };

  const openTakePhoto = async () => {
    if (permissionsState.storage === "granted") {
      try {
        const image = (await ImagePicker.openCamera(
          imageUploadOptions
        )) as ImagePickerResult;
        if (!image)
          return showBanner({
            message: "Image upload failed. Please try again.",
            type: "danger",
          });
        setState({ ...state, thumbnailFile: image });
        onCloseUploadImage();
      } catch (err) {}
    } else {
      onCloseUploadImage();
      onOpenPermissions();
    }
  };

  const openCameraRoll = async () => {
    if (permissionsState.storage === "granted") {
      try {
        const image = (await ImagePicker.openPicker(
          imageUploadOptions
        )) as ImagePickerResult;
        if (!image)
          return showBanner({
            message: "Image upload failed. Please try again.",
            type: "danger",
          });
        setState({ ...state, thumbnailFile: image });
        onCloseUploadImage();
      } catch (err) {}
    } else {
      onCloseUploadImage();
      onOpenPermissions();
    }
  };

  const uploadThumbnail = async () => {
    const { thumbnailFile, title } = state;
    if (!thumbnailFile) {
      return showBanner({
        message: "Please upload a thumbnail image.",
        type: "danger",
      });
    }
    const { path, mime } = thumbnailFile;

    const data = new FormData();
    data.append("thumbnail", {
      name: "thumbnail",
      type: mime,
      uri: Platform.OS === "ios" ? path.replace("file://", "") : path,
    });

    data.append("deviceId", deviceId);

    const response = await request({
      url: "/user/streams/thumbnail",
      method: "POST",
      body: data,
    });

    if (response.ok) {
      setState(initialState);
      props.navigation.push("ManageLiveStream", { streamTitle: title });
    } else {
      showBanner({
        message: "A problem occurred.",
        description: "Please try uploading your thumbnail again.",
        type: "danger",
      });
    }
  };

  const share = async () =>
    launchShare({
      title: `Join my live stream on ${appName}!`,
      message: `Join my live stream on ${appName}!`,
      type: "toViewLiveStream",
      deepLinkArgs: { deviceId },
    });

  const onGoBack = () => {
    onCloseUploadImage();
    setState(initialState);
    props.navigation.goBack();
  };
  return (
    <View style={{ flex: 1, backgroundColor }}>
      <View style={{ paddingBottom: 10, paddingTop: statusBarHeight }}>
        <View
          style={{ position: "absolute", top: statusBarHeight + 10, left: 10 }}
        >
          {canGoBack && (
            <GoBackButton
              style={{ paddingHorizontal: 10 }}
              onPress={onGoBack}
            />
          )}
        </View>
        <View style={{ alignSelf: "center", marginTop: 10 }}>
          {streamContext.state.numViewers > 1 && (
            <Text w="bold" a="center">
              {numberWithCommas(streamContext.state.numViewers)} people are
              online
            </Text>
          )}
          <Text a="center" s="subHeader">
            👏
          </Text>
        </View>
      </View>

      <ParentView
        onWrapperPress={Keyboard.dismiss}
        noHorizontalPadding
        safeBottomInset
        wrapperStyle={{ backgroundColor: "transparent" }}
        scrollViewContentContainerStyle={{ backgroundColor: "transparent" }}
        style={{
          backgroundColor: "transparent",
          paddingHorizontal: 12,
          justifyContent: "space-around",
          flex: 1,
        }}
      >
        {!state.showThumbnailUpload ? (
          <>
            <View>
              <Text s="subHeader" w="bold" a="center" linebreak>
                Start A Live Stream!
              </Text>
              <Text s="xxl" w="semiBold" a="center">
                Name this stream:{" "}
              </Text>
              <TextInput
                style={{
                  fontFamily: "Muli",
                  alignSelf: "center",
                  paddingVertical: 10,
                  marginVertical: 20,
                  fontSize: 28,
                  borderBottomWidth: 1,
                  width: window.width * 0.8,
                  borderBottomColor: textColor,
                  color: textColor,
                }}
                placeholder={quirkyPhrase}
                placeholderTextColor={`${textColor}55`}
                maxLength={20}
                numberOfLines={1}
                enablesReturnKeyAutomatically
                value={state.title}
                selectionColor={tintColor}
                onChangeText={(title) => setState({ ...state, title })}
                autoCapitalize="words"
              />
              <Text s="lg" w="semiBold" a="center" linebreak>
                We'll notify your followers shortly so that they don't miss it.
              </Text>
              <Text s="lg" w="semiBold" a="center" linebreak>
                Tap the "Share" button below to post on other apps.
              </Text>
              <Text s="lg" w="semiBold" a="center" linebreak>
                If you're lucky, you might end up trending 😉
              </Text>
              <Button title="Next" onPress={submitTitle} />
              <TextButton
                containerStyle={{ marginTop: 20 }}
                textStyle={{ color: "white" }}
                textProps={{ a: "center", w: "bold", s: "xl" }}
                title="Share"
                onPress={share}
                IconComponent={
                  <Icon
                    library="ionicons"
                    name={`${Platform.OS === "ios" ? "ios" : "md"}-share`}
                    size={24}
                    color="white"
                    style={{ marginLeft: 10 }}
                  />
                }
              />
            </View>
          </>
        ) : (
          <View>
            <Text s="subHeader" w="bold" a="center">
              Upload a Thumbnail
            </Text>
            <Text style={{ marginTop: 20 }} a="center" s="xl" w="bold">
              Preview
            </Text>
            <LiveStreamThumbnail
              index={0}
              deviceId="1"
              streamTitle={state.title}
              thumbnail={state.thumbnailFile?.path}
              avatar={global.state.avatar}
              upvote={42}
              downvote={0}
              numViewers={63}
              username={global.state.username}
              onPress={async () => {}}
              onPressProfile={() => {}}
              onReportSubmit={(deviceId: string) => {}}
              onBlockSubmit={(deviceId: string) => {}}
              isFollowing
              style={{
                width: window.width - 60,
                height: 300,
                alignSelf: "center",
                marginTop: 20,
              }}
              activeOpacity={1}
              hideEllipsis
              indicateIfPlaceholder
            />
            {state.thumbnailFile && (
              <Button
                title="Start Live Stream"
                gradientColors={gradientColors}
                onPress={uploadThumbnail}
                loading={loading}
              />
            )}
            <Button
              outline={!!state.thumbnailFile}
              title={`${state.thumbnailFile ? "Change" : "Select"} Thumbnail`}
              onPress={onOpenUploadImage}
            />
            <TextButton
              containerStyle={{ marginTop: 10 }}
              textProps={{ a: "center", w: "bold", s: "lg" }}
              title="Change Name"
              onPress={() => setState({ ...state, showThumbnailUpload: false })}
            />
          </View>
        )}
      </ParentView>
      <PermissionsSlideUp
        title="Permissions Needed"
        permissionsState={permissionsState}
        refreshPermissionStatus={refreshPermissionStatus}
        ref={permissionsRef}
        onPressX={onClosePermissions}
        onAllPermissionsGrantedCallback={onClosePermissions}
      />
      <SlideUp ref={uploadImageRef}>
        <SlideUpButton onPress={openTakePhoto} type="take_photo" />
        <SlideUpButton onPress={openCameraRoll} type="upload_photo" />
        <SlideUpButton
          type="help_feedback"
          title="Help or Feedback"
          onPress={() => {
            onCloseUploadImage();
            openHelpFeedbackSlideUp();
          }}
        />
      </SlideUp>
      <HelpFeedbackSlideUp
        ref={helpFeedbackSlideUp}
        onCancel={closeHelpFeedbackSlideUp}
        onSubmit={closeHelpFeedbackSlideUp}
      />
    </View>
  );
});

export default CreateLiveStream;
