import { Button, StatusBar } from "../../components";
import FastImage from "react-native-fast-image";
import { StyleSheet, View } from "react-native";
import React from "react";

import { AuthStackNavProps } from "../../navigation";
import Video from "react-native-video";
import { logoRectangleTransparent } from "../../assets";
import { statusBarHeight, window } from "../../constants";

type Props = AuthStackNavProps<"Start">;

const Start = (props: Props) => {
  return (
    <View style={{ justifyContent: "center", flex: 1 }}>
      <StatusBar />
      <Video
        source={{
          uri: "https://i.imgur.com/JyfqPw4.mp4",
        }}
        style={styles.backgroundVideo}
        muted
        repeat
        resizeMode={"cover"}
        rate={1.0}
        disableFocus
        ignoreSilentSwitch={"obey"}
      />
      <View
        style={[styles.backgroundVideo, { backgroundColor: "rgba(0,0,0,0.4)" }]}
      />
      <View
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
          flexDirection: "column",
          marginTop: statusBarHeight,
          marginHorizontal: 12,
        }}
      >
        <FastImage
          source={logoRectangleTransparent}
          resizeMode="contain"
          style={{ alignSelf: "center", width: 250, height: 75 }}
        />
        <Button
          title="Make Account"
          onPress={() => props.navigation.push("SignUp")}
        />
        <Button
          title="Sign In"
          onPress={() => props.navigation.push("SignIn")}
          outline
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundVideo: {
    ...StyleSheet.absoluteFillObject,
    height: window.height,
    alignItems: "stretch",
    backgroundColor: "black",
  },
});

export default Start;
