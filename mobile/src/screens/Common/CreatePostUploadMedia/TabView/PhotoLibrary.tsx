import React, { useEffect, useState, useRef } from "react";
import CameraRoll from "@react-native-community/cameraroll";
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { window, tintColor, shadowBox } from "../../../../constants";
import { Text, LoadingIndicator } from "../../../../components";
import * as Animatable from "react-native-animatable";
import { getFileExtension } from "../../../../utils";
import { cloneDeep } from "lodash";

export const initialUploadedMedia: UploadedMedia = { filetype: "", path: "" };

export interface UploadedMedia {
  filetype: string;
  path: string;
}

export interface UploadedMedia {
  filetype: string;
  path: string;
}

const convertPhotoIdentifierToUploadedMediaObject = (
  photoIdentifier: CameraRoll.PhotoIdentifier
): UploadedMedia => {
  return {
    path: photoIdentifier.node.image.uri,
    filetype: getFileExtension(photoIdentifier.node.image.filename),
  };
};
interface Props {
  updateFocusedPhotoLibraryItem: (photoLibraryItem: UploadedMedia) => void;
  setSelectedPhotos: (newSelectedPhotos: UploadedMedia[]) => void;
  onSubmit: () => void;
  selectedPhotos: UploadedMedia[];
}

interface State {
  photoLibrary: CameraRoll.PhotoIdentifier[];
  pageInfo: CameraRoll.PhotoIdentifiersPageInfo;
  paginationLoading: boolean;
}

const initialState: State = {
  photoLibrary: [],
  pageInfo: { has_next_page: false },
  paginationLoading: false,
};

const PhotoLibrary = React.memo((props: Props) => {
  const [state, setState] = useState(initialState);
  const promptRef: any = useRef(null);

  useEffect(() => {
    (async () => {
      const photoLibrary = await CameraRoll.getPhotos({
        first: 30,
        assetType: "Photos",
      });
      setState({
        ...state,
        photoLibrary: photoLibrary.edges,
        pageInfo: photoLibrary.page_info,
      });
    })();
    return () => {
      props.setSelectedPhotos([]);
    };
  }, []);

  const paginate = async () => {
    if (state.pageInfo.has_next_page) {
      setState({ ...state, paginationLoading: true });
      const photoLibrary = await CameraRoll.getPhotos({
        first: 30,
        after: state.pageInfo.end_cursor,
        assetType: "Photos",
      });
      setState({
        ...state,
        photoLibrary: [...state.photoLibrary, ...photoLibrary.edges],
        pageInfo: photoLibrary.page_info,
        paginationLoading: false,
      });
    }
  };

  const onPressThumbnail = (uploadedMedia: UploadedMedia) => {
    const selectedPhotosCopy = cloneDeep(props.selectedPhotos);
    const selectedPhotosData = findPhoto(uploadedMedia);
    if (selectedPhotosData) {
      selectedPhotosCopy.splice(selectedPhotosData.index, 1);
      if (selectedPhotosCopy.length > 0) {
        props.updateFocusedPhotoLibraryItem(
          selectedPhotosCopy[selectedPhotosCopy.length - 1]
        );
      } else props.updateFocusedPhotoLibraryItem(initialUploadedMedia);
    } else {
      if (selectedPhotosCopy.length > 6) return;
      selectedPhotosCopy.push(uploadedMedia);
      props.updateFocusedPhotoLibraryItem(uploadedMedia);
    }
    props.setSelectedPhotos(selectedPhotosCopy);
  };

  const findPhoto = (uploadedMedia: UploadedMedia) => {
    const index = props.selectedPhotos.findIndex(
      (searchedUploadedMedia) =>
        searchedUploadedMedia.path === uploadedMedia.path
    );
    if (index === -1) return;
    const photo = props.selectedPhotos[index];
    return { photo, index };
  };

  const findPhotoIndex = (uploadedMedia: UploadedMedia) =>
    props.selectedPhotos.findIndex(
      (searchedUploadedMedia) =>
        searchedUploadedMedia.path === uploadedMedia.path
    );

  const SLIDE_UP_DOWN = {
    from: { marginTop: 0 },
    to: { marginTop: 10 },
  };

  const NUM_COLUMNS = 3;
  const THUMBNAIL_SIZE = window.width / NUM_COLUMNS - 1;

  return (
    <View>
      {props.selectedPhotos.length === 0 && (
        <View style={{ alignItems: "center", zIndex: 1 }}>
          <Animatable.View
            animation={SLIDE_UP_DOWN}
            duration={1000}
            iterationCount={"infinite"}
            direction="alternate"
            style={{
              position: "absolute",
              top: 10,
              backgroundColor: `${tintColor}dd`,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 20,
              ...shadowBox,
            }}
            ref={(ref) => {
              promptRef.current = ref;
            }}
          >
            <Text s="sm" w="bold">
              Pick up to 7 photos!
            </Text>
          </Animatable.View>
        </View>
      )}
      <FlatList
        numColumns={NUM_COLUMNS}
        data={state.photoLibrary}
        keyExtractor={(_, index) => index.toString()}
        onEndReachedThreshold={0.4}
        onEndReached={paginate}
        ListFooterComponent={() =>
          state.pageInfo.has_next_page ? (
            <LoadingIndicator style={{ marginVertical: 20 }} />
          ) : (
            <Text a="center" w="bold" style={{ marginVertical: 20 }}>
              You've reached the 🔚
            </Text>
          )
        }
        renderItem={({ item }) => (
          <PhotoLibraryThumbnail
            {...item}
            thumbnailSize={THUMBNAIL_SIZE}
            selected={
              !!findPhoto(convertPhotoIdentifierToUploadedMediaObject(item))
            }
            selectedIndex={findPhotoIndex(
              convertPhotoIdentifierToUploadedMediaObject(item)
            )}
            onPress={onPressThumbnail}
          />
        )}
      />
    </View>
  );
});

interface PhotoLibraryThumbnailProps extends CameraRoll.PhotoIdentifier {
  thumbnailSize: number;
  onPress: (uploadedMedia: UploadedMedia) => void;
  selected: boolean;
  selectedIndex: number;
}

const PhotoLibraryThumbnail = (props: PhotoLibraryThumbnailProps) => {
  const onPress = () => {
    props.onPress(convertPhotoIdentifierToUploadedMediaObject(props));
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{ padding: 1, backgroundColor: "transparent" }]}
    >
      <Image
        source={{ uri: props.node.image.uri }}
        style={{ width: props.thumbnailSize, height: props.thumbnailSize }}
      />
      {props.selected && (
        <View
          style={{
            position: "absolute",
            right: 5,
            top: 5,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: "white",
            backgroundColor: tintColor,
            height: 20,
            width: 20,
            borderRadius: 4,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View>
            <Text w="bold" s="xs" style={{ color: "white" }}>
              {props.selectedIndex + 1}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default PhotoLibrary;
