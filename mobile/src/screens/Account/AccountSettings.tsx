import {
  Avatar,
  Button,
  Icon,
  ParentView,
  SlideUp,
  SlideUpButton,
  Text,
  TextInputBox,
  HelpFeedbackSlideUp,
  LoadingIndicator,
} from "../../components";
import ImagePicker, {
  Options as ImagePickerOptions,
  Image as ImagePickerResult,
} from "react-native-image-crop-picker";
import { Keyboard, Platform, TouchableOpacity, View } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import {
  popup,
  showBanner,
  validatePersonName,
  writeCacheMulti,
  validateBio,
  cleanOutgoingText,
} from "../../utils";
import { useSlideUp, useLoadingRequest } from "../../hooks";

import { AccountStackNavProps } from "../../navigation";
import { GlobalContext, ThemeContext } from "../../contexts";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { isEqual } from "lodash";
import { tintColor, defaultHorizontalInset } from "../../constants";

type Props = AccountStackNavProps<"AccountSettings">;

interface Settings {
  firstName: string;
  lastName: string;
  bio: string;
  avatar: string;
  fileType: string;
}

const initialSettings: Settings = {
  firstName: "",
  lastName: "",
  bio: "",
  avatar: "",
  fileType: "",
};

const AccountSettings = (props: Props) => {
  const global = useContext(GlobalContext);
  const { backgroundColor } = useContext(ThemeContext);
  const [currentFocused, setCurrentFocused] = useState("");
  const [mutatedData, setMutatedData] = useState(initialSettings);
  const [originalData, setOriginalData] = useState(initialSettings);
  const [loadingState, setLoadingState] = useState({
    initLoading: true,
    uploadLoading: false,
  });
  const [error, setError] = useState(false);
  const [request] = useLoadingRequest();
  const [uploadImageRef, onOpenUploadImage, onCloseUploadImage] = useSlideUp();

  props.navigation.setOptions(
    error
      ? {}
      : {
          headerLeft: () => (
            <Icon
              style={{ paddingLeft: 10 }}
              library="ionicons"
              name={`${Platform.OS === "ios" ? "ios" : "md"}-arrow-back`}
              color={tintColor}
              size={32}
              onPress={async () => {
                const dataChanged = !isEqual(originalData, mutatedData);
                if (dataChanged)
                  popup({
                    title: "Would you like to save your changes?",
                    buttonOptions: [
                      { text: "Yes", onPress: save },
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
        }
  );

  const changeCurrentFocused = (fieldName: string) =>
    setCurrentFocused(fieldName);

  useEffect(() => {
    const keyboardWillHideListenerRef = Keyboard.addListener(
      "keyboardWillHide",
      keyboardWillHide
    );

    return () => keyboardWillHideListenerRef.remove();
  }, []);

  const [
    helpFeedbackSlideUp,
    openHelpFeedbackSlideUp,
    closeHelpFeedbackSlideUp,
  ] = useSlideUp();

  useEffect(() => {
    (async () => {
      const response = await request({
        url: "/user/settings/account",
        method: "GET",
      });
      setLoadingState((loadingState) => ({
        ...loadingState,
        initLoading: false,
      }));
      if (response.ok) {
        const { firstName, lastName, bio, avatar } = response.data;
        setOriginalData({
          firstName,
          lastName,
          bio,
          avatar,
          fileType: originalData.fileType,
        });
        setMutatedData({
          firstName,
          lastName,
          bio,
          avatar,
          fileType: originalData.fileType,
        });
      } else {
        setError(true);
      }
    })();
  }, []);

  const keyboardWillHide = () => changeCurrentFocused("");

  const imageUploadOptions: ImagePickerOptions = {
    width: 500,
    height: 500,
    cropping: true,
    multiple: false,
    compressImageMaxWidth: 300,
    compressImageMaxHeight: 300,
    compressImageQuality: 0.2,
    loadingLabelText: "Sautéing the onions....",
    forceJpg: true,
    mediaType: "photo",
  };

  const openTakePhoto = async () => {
    onCloseUploadImage();
    try {
      const image = (await ImagePicker.openCamera(
        imageUploadOptions
      )) as ImagePickerResult;
      if (!image)
        return showBanner({
          message: "Image upload failed. Please try again.",
          type: "danger",
        });

      setMutatedData((mutatedData) => ({
        ...mutatedData,
        avatar: image.path,
        fileType: image.mime,
      }));
    } catch (err) {}
  };

  const openCameraRoll = async () => {
    onCloseUploadImage();
    try {
      const image = (await ImagePicker.openPicker(
        imageUploadOptions
      )) as ImagePickerResult;
      if (!image)
        return showBanner({
          message: "Image upload failed. Please try again.",
          type: "danger",
        });

      setMutatedData((mutatedData) => ({
        ...mutatedData,
        avatar: image.path,
        fileType: image.mime,
      }));
    } catch (err) {}
  };

  const save = async () => {
    const dataChanged = !isEqual(originalData, mutatedData);

    if (!dataChanged) return props.navigation.goBack();

    if (!mutatedData.firstName)
      return showBanner({
        message: "Your first name can't be blank.",
        type: "danger",
      });
    if (!mutatedData.lastName)
      return showBanner({
        message: "Your last name can't be blank.",
        type: "danger",
      });

    const data = new FormData();

    if (mutatedData.avatar !== originalData.avatar) {
      data.append("avatar", {
        name: "avatar",
        type: mutatedData.fileType,
        uri:
          Platform.OS === "ios"
            ? mutatedData.avatar.replace("file://", "")
            : mutatedData.avatar,
      });
    }

    if (mutatedData.firstName !== originalData.firstName) {
      if (validatePersonName(mutatedData.firstName)) {
        data.append(
          "firstName",
          cleanOutgoingText({
            text: mutatedData.firstName,
            restrictProfane: true,
          })[0]
        );
      } else {
        return showBanner({
          message: "Your first name has an issue.",
          type: "danger",
        });
      }
    }
    if (mutatedData.lastName !== originalData.lastName) {
      if (validatePersonName(mutatedData.lastName)) {
        data.append(
          "lastName",
          cleanOutgoingText({
            text: mutatedData.lastName,
            restrictProfane: true,
          })[0]
        );
      } else {
        return showBanner({
          message: "Your last name has an issue.",
          type: "danger",
        });
      }
    }
    if (mutatedData.bio !== originalData.bio) {
      if (validateBio(mutatedData.bio)) {
        data.append(
          "bio",
          cleanOutgoingText({
            text: mutatedData.bio,
            restrictProfane: true,
          })[0]
        );
      } else {
        return showBanner({
          message: "Your bio has an issue.",
          type: "danger",
        });
      }
    }

    setLoadingState((loadingState) => ({
      ...loadingState,
      uploadLoading: true,
    }));

    const response = await request({
      url: "/user/settings/account",
      method: "PUT",
      body: data,
    });

    setLoadingState((loadingState) => ({
      ...loadingState,
      uploadLoading: false,
    }));

    if (response.ok) {
      const { firstName, lastName, avatar, bio } = response.data;
      global.setState({ firstName, lastName, avatar, bio });
      await writeCacheMulti([
        ["firstName", firstName],
        ["lastName", lastName],
        ["avatar", avatar],
        ["bio", bio],
      ]);
      return props.navigation.goBack();
    } else {
      return showBanner({
        message: "An error occurred. Please try saving again.",
        type: "danger",
      });
    }
  };

  return (
    <ParentView
      style={{ flex: 1 }}
      noHorizontalPadding
      noBottomTabOffset
      noScroll
    >
      <KeyboardAwareScrollView
        contentContainerStyle={{ flex: 1, backgroundColor }}
        extraScrollHeight={-100}
      >
        <View style={{ flex: 1, paddingHorizontal: defaultHorizontalInset }}>
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
              <TouchableOpacity
                style={{ alignSelf: "center" }}
                onPress={onOpenUploadImage}
              >
                <Avatar
                  style={{
                    height: 125,
                    width: 125,
                    alignSelf: "center",
                    resizeMode: "cover",
                  }}
                  avatar={mutatedData.avatar}
                />
                <Text t="highlight" style={{ marginTop: 20 }} a="center">
                  Change Profile Photo
                </Text>
              </TouchableOpacity>
              <View style={{ marginTop: 20 }}>
                <TextInputBox
                  value={mutatedData.firstName}
                  showCheckbox={validatePersonName(mutatedData.firstName)}
                  label="First Name"
                  maxLength={30}
                  onChangeText={(firstName) =>
                    setMutatedData((mutatedData) => ({
                      ...mutatedData,
                      firstName,
                    }))
                  }
                  changeCurrentFocused={changeCurrentFocused}
                  currentFocused={currentFocused}
                />
                <TextInputBox
                  label="Last Name"
                  value={mutatedData.lastName}
                  showCheckbox={validatePersonName(mutatedData.lastName)}
                  maxLength={30}
                  onChangeText={(lastName) => {
                    setMutatedData((mutatedData) => ({
                      ...mutatedData,
                      lastName,
                    }));
                  }}
                  changeCurrentFocused={changeCurrentFocused}
                  currentFocused={currentFocused}
                />
                <TextInputBox
                  label="Bio"
                  value={mutatedData.bio}
                  showCheckbox={validateBio(mutatedData.bio)}
                  maxLength={150}
                  onChangeText={(bio) => {
                    setMutatedData((mutatedData) => ({ ...mutatedData, bio }));
                  }}
                  autoCapitalize="sentences"
                  changeCurrentFocused={changeCurrentFocused}
                  currentFocused={currentFocused}
                />
              </View>
              <TouchableOpacity
                style={{ marginTop: 10 }}
                onPress={() => props.navigation.push("MoreAccountSettings")}
              >
                <Text t="muted">More Settings</Text>
              </TouchableOpacity>
              <Button
                style={{ marginTop: 20 }}
                title="Save"
                onPress={save}
                loading={loadingState.uploadLoading}
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
            </>
          )}
        </View>
      </KeyboardAwareScrollView>
    </ParentView>
  );
};

export default AccountSettings;
