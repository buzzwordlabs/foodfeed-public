import { Dimensions, Platform } from "react-native";

export const isIphoneX = () => {
  const { width, height } = Dimensions.get("window");
  return (
    Platform.OS === "ios" &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    (height === 812 || width === 812 || height === 896 || width === 896)
  );
};

export const ifIphoneX = (iphoneXStyle: any, regularStyle: any) => {
  if (isIphoneX()) {
    return iphoneXStyle;
  }
  return regularStyle;
};

export const getBottomSpace = () => {
  return isIphoneX() ? 34 : 0;
};

export const getStatusBarHeight = (safe?: boolean) => {
  return Platform.select({
    ios: ifIphoneX(safe ? 44 : 30, 20),
    android: 0,
    default: 0,
  });
};
