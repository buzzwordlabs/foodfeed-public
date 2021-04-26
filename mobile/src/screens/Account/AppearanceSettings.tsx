import { ParentView, Text } from "../../components";
import { Platform, StyleSheet, Switch, View } from "react-native";
import React, { useContext } from "react";
import { tintColor } from "../../constants";

import { ThemeContext } from "../../contexts";

const AppearanceSettings = () => {
  const { themeName, borderColor, setTheme } = useContext(ThemeContext);
  return (
    <ParentView>
      <View>
        <Text s="header" w="bold">
          Appearance
        </Text>
        <View
          style={{
            marginTop: 30,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor,
          }}
        >
          <View>
            <Text w="semiBold" s="lg">
              Dark Mode
            </Text>
          </View>
          <Switch
            trackColor={{ true: tintColor, false: "" }}
            thumbColor={
              Platform.OS === "android" && themeName === "dark"
                ? tintColor
                : "white"
            }
            onValueChange={() =>
              setTheme(themeName === "dark" ? "light" : "dark")
            }
            value={themeName === "dark"}
          />
        </View>
      </View>
    </ParentView>
  );
};

export default AppearanceSettings;
