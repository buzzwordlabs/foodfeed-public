import React, {
  useContext,
  useRef,
  forwardRef,
  useState,
  useEffect,
} from "react";
import { View, Image } from "react-native";
import {
  TabView,
  Text,
  HeaderTextButton,
  PermissionsSlideUp,
} from "../../../components";
import { ThemeContext } from "../../../contexts";
import { HomeStackNavProps, CreateStackNavProps } from "../../../navigation";
import PhotoLibrary from "./TabView/PhotoLibrary";
import TakePhoto from "./TabView/TakePhoto";
import { window } from "../../../constants";
import { RNCamera, TakePictureResponse } from "react-native-camera";
import * as Animatable from "react-native-animatable";
import { getFileExtension } from "../../../utils";
import usePermissionStatus from "../../../hooks/usePermissionStatus";
import { UploadedMedia, initialUploadedMedia } from "./TabView/PhotoLibrary";
import { useSlideUp } from "../../../hooks";
import { RefreshPermissionStatusCallback } from "../../../components/SlideUp/SubScreens/PermissionsSlideUp";

enum TabRouteTitles {
  "Photo" = "Photo",
  "Library" = "Library",
}

enum TabRouteKeys {
  take_photo = "take_photo",
  photo_library = "photo_library",
}

const tabOptionConfig: {
  key: keyof typeof TabRouteKeys;
  title: keyof typeof TabRouteTitles;
}[] = [
  { key: TabRouteKeys.take_photo, title: TabRouteTitles["Photo"] },
  { key: TabRouteKeys.photo_library, title: TabRouteTitles["Library"] },
];

export type MediaSource = "upload_from_camera_roll" | "upload_from_image_take";

interface Props extends CreateStackNavProps<"CreatePostUploadMedia"> {}

interface State {
  focusedPhotoLibraryItem: UploadedMedia;
  focusedTakePhotoItem: UploadedMedia;
  flashEnabled: boolean;
  useBackCamera: boolean;
  selectedPhotos: UploadedMedia[];
}

const initialState: State = {
  focusedPhotoLibraryItem: initialUploadedMedia,
  focusedTakePhotoItem: initialUploadedMedia,
  flashEnabled: false,
  useBackCamera: true,
  selectedPhotos: [],
};

const CreatePostUploadMedia = (props: Props) => {
  const [state, setState] = useState(initialState);
  const [tabIndex, setTabIndex] = useState(0);
  const [routes] = React.useState(tabOptionConfig);
  const { backgroundColor } = useContext(ThemeContext);
  const cameraRef: any = useRef(null);

  const [permissionsRef, onOpenPermissions, onClosePermissions] = useSlideUp();
  const [permissionsState, refreshPermissionStatus] = usePermissionStatus([
    "camera",
    "microphone",
    "storage",
  ]);

  props.navigation.setOptions({
    headerShown: true,
    title: "Create Post",
    headerRight: () => {
      return state.focusedPhotoLibraryItem.path ||
        state.focusedTakePhotoItem.path ? (
        <Animatable.View animation="fadeInRight" duration={500}>
          <HeaderTextButton title="Next" onPress={onSubmit} />
        </Animatable.View>
      ) : null;
    },
  });

  const onRefreshPermissionStatusCallback: RefreshPermissionStatusCallback = (
    permissionsState
  ) => {
    if (permissionsState["allStatuses"] === "granted") {
      onClosePermissions();
    } else {
      onOpenPermissions();
    }
  };

  const onSubmit = () => {
    props.navigation.push("CreatePostFinalize", {
      uploadedMedia:
        tabIndex === 0 ? [state.focusedTakePhotoItem] : state.selectedPhotos,
      mediaSource:
        tabIndex === 0 ? "upload_from_camera_roll" : "upload_from_image_take",
    });
  };

  const updateFocusedPhotoLibraryItem = (
    focusedPhotoLibraryItem: UploadedMedia
  ) => {
    setState({ ...state, focusedPhotoLibraryItem });
  };

  const onPressTakePhoto = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.5 };
      const data: TakePictureResponse = await cameraRef.current.takePictureAsync(
        options
      );
      setState((state) => ({
        ...state,
        focusedTakePhotoItem: convertTakePictureResponseToUploadedMediaObject(
          data
        ),
      }));
    }
  };

  const convertTakePictureResponseToUploadedMediaObject = (
    takePictureResponse: TakePictureResponse
  ) => {
    return {
      path: takePictureResponse.uri,
      filetype: getFileExtension(takePictureResponse.uri),
    };
  };

  const onPressToggleFlash = () => {
    setState(({ flashEnabled }) => ({ ...state, flashEnabled: !flashEnabled }));
  };

  const onPressToggleCameraOrientation = () => {
    setState(({ useBackCamera }) => ({
      ...state,
      useBackCamera: !useBackCamera,
    }));
  };

  const onClearFocusedTakePhotoItem = () => {
    setState((state) => ({
      ...state,
      focusedTakePhotoItem: initialUploadedMedia,
    }));
  };

  const setSelectedPhotos = (selectedPhotos: UploadedMedia[]) => {
    setState((state) => ({ ...state, selectedPhotos }));
  };

  const renderScene = ({
    route,
  }: {
    route: { key: keyof typeof TabRouteKeys };
  }): React.ReactNode => {
    switch (route.key) {
      case "take_photo":
        return (
          <TakePhoto
            flashEnabled={state.flashEnabled}
            onPressToggleFlash={onPressToggleFlash}
            onPressTakePhoto={onPressTakePhoto}
            focusedTakePhotoItem={state.focusedTakePhotoItem}
            onPressToggleCameraOrientation={onPressToggleCameraOrientation}
            onClearFocusedTakePhotoItem={onClearFocusedTakePhotoItem}
            onSubmit={onSubmit}
          />
        );
      case "photo_library":
        return (
          <PhotoLibrary
            updateFocusedPhotoLibraryItem={updateFocusedPhotoLibraryItem}
            selectedPhotos={state.selectedPhotos}
            setSelectedPhotos={setSelectedPhotos}
            onSubmit={onSubmit}
          />
        );
      default:
        return <></>;
    }
  };

  return (
    <View style={{ backgroundColor, flex: 1 }}>
      {permissionsState.allStatuses === "granted" && (
        <>
          <PhotoFromLibraryPreview
            ref={cameraRef}
            media={
              tabIndex === 0
                ? state.focusedTakePhotoItem
                : state.focusedPhotoLibraryItem
            }
            mode={tabIndex === 0 ? "photo" : "library"}
            flashEnabled={state.flashEnabled}
            useBackCamera={state.useBackCamera}
          />
          <TabView
            style={{ zIndex: 1 }}
            navigationState={{ index: tabIndex, routes }}
            renderScene={renderScene}
            onIndexChange={setTabIndex}
          />
        </>
      )}
      <PermissionsSlideUp
        ref={permissionsRef}
        permissionsState={permissionsState}
        onPressX={() => {
          onClosePermissions();
          props.navigation.goBack();
        }}
        refreshPermissionStatus={refreshPermissionStatus}
        onAllPermissionsGrantedCallback={onClosePermissions}
        onRefreshPermissionStatusCallback={onRefreshPermissionStatusCallback}
      />
    </View>
  );
};

interface PhotoFromLibraryPreviewProps {
  media: UploadedMedia;
  mode: "photo" | "library";
  flashEnabled: boolean;
  useBackCamera: boolean;
}

const PhotoFromLibraryPreview = forwardRef(
  (props: PhotoFromLibraryPreviewProps, cameraRef: any) => {
    const size = window.width;
    const dimensions = { height: size, width: size };
    return (
      <View style={dimensions}>
        {props.media.path ? (
          <Image style={{ flex: 1 }} source={{ uri: props.media.path }} />
        ) : props.mode === "photo" ? (
          <RNCamera
            ref={(ref) => {
              cameraRef.current = ref;
            }}
            style={dimensions}
            type={
              props.useBackCamera
                ? RNCamera.Constants.Type.back
                : RNCamera.Constants.Type.front
            }
            zoom={0}
            flashMode={
              props.flashEnabled
                ? RNCamera.Constants.FlashMode.on
                : RNCamera.Constants.FlashMode.off
            }
          />
        ) : (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text s="subHeader" a="center" w="bold">
              Pick a photo to upload! 📷
            </Text>
          </View>
        )}
      </View>
    );
  }
);

export default CreatePostUploadMedia;
