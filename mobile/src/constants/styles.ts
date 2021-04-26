import { StyleSheet } from "react-native";
import { dividerColor, tintColor } from "./colors";

export const defaultHorizontalInset = 20;

export const maxFontSizeMultiplier = 1.5;

export const {
  roundImage,
  shadowBox,
  sectionDividerStyle,
  shadowBoxTop,
  shadowBoxTint,
  deepShadowBox,
} = StyleSheet.create({
  sectionDividerStyle: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: dividerColor,
    paddingBottom: 20,
    marginBottom: 20,
  },
  shadowBox: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shadowBoxTint: {
    shadowColor: tintColor,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  deepShadowBox: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  shadowBoxTop: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deepShadowBoxTop: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  roundImage: {
    borderWidth: 1,
    borderColor: "lightgray",
    borderRadius: 1000,
    overflow: "hidden",
  },
});
