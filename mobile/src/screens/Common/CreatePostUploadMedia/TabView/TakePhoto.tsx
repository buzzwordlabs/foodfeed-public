import React, { useContext } from "react";
import { View, TouchableOpacity, Platform } from "react-native";
import { ThemeContext } from "../../../../contexts";
import { tintColor } from "../../../../constants";
import { Icon, Text } from "../../../../components";
import * as Animatable from "react-native-animatable";
import { UploadedMedia } from "./PhotoLibrary";

interface Props {
  onPressTakePhoto: () => void;
  onClearFocusedTakePhotoItem: () => void;
  onPressToggleFlash: () => void;
  onPressToggleCameraOrientation: () => void;
  onSubmit: () => void;
  flashEnabled: boolean;
  focusedTakePhotoItem: UploadedMedia;
}

const TakePhoto = (props: Props) => {
  const { textColor, backgroundColor } = useContext(ThemeContext);
  return props.focusedTakePhotoItem.path ? (
    <Animatable.View
      animation="fadeInRight"
      duration={500}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <Text a="center" w="bold" s="subHeader" style={{ marginBottom: 30 }}>
        Looking good?
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TouchableOpacity
          style={{
            borderColor: "gray",
            borderWidth: 1,
            paddingVertical: 15,
            paddingHorizontal: 25,
            marginHorizontal: 5,
            borderRadius: 10,
          }}
          onPress={props.onClearFocusedTakePhotoItem}
        >
          <Text style={{ fontSize: 50 }} a="center">
            🤢 👎
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={props.onSubmit}
          style={{
            borderColor: "gray",
            borderWidth: 1,
            paddingVertical: 15,
            paddingHorizontal: 25,
            marginHorizontal: 5,
            borderRadius: 10,
          }}
        >
          <Text style={{ fontSize: 50 }} a="center">
            😍 👍
          </Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  ) : (
    <View
      style={{
        flex: 1,
        justifyContent: "flex-end",
        paddingBottom: 50,
        backgroundColor,
      }}
    >
      <>
        <TouchableOpacity
          onPress={props.onPressTakePhoto}
          style={{
            width: 80,
            height: 80,
            borderRadius: 80,
            backgroundColor: textColor,
            alignSelf: "center",
            borderWidth: 5,
            borderColor: tintColor,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 40 }}>📸</Text>
          </View>
        </TouchableOpacity>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 10,
          }}
        >
          <TouchableOpacity
            style={{
              width: 50,
              height: 50,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={props.onPressToggleFlash}
          >
            <Icon
              size={32}
              library="ionicons"
              name={`${Platform.OS === "ios" ? "ios" : "md"}-flash${
                props.flashEnabled ? "" : "-off"
              }`}
              color="lightgray"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              width: 50,
              height: 50,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={props.onPressToggleCameraOrientation}
          >
            <Icon
              size={32}
              library="materialComIcons"
              name="sync"
              color="lightgray"
            />
          </TouchableOpacity>
        </View>
      </>
    </View>
  );
};
export default TakePhoto;
