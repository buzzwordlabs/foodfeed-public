import { Dimensions, Platform } from "react-native";
import { getBottomSpace, getStatusBarHeight, ifIphoneX } from "./statusBar";

import { initialWindowSafeAreaInsets } from "react-native-safe-area-context";

const getDefaultHeaderHeight = (
  layout: { width: number; height: number },
  statusBarHeight: number
): number => {
  const isLandscape = layout.width > layout.height;

  let headerHeight;

  if (Platform.OS === "ios") {
    // @ts-ignore
    if (isLandscape && !Platform.isPad) {
      headerHeight = 32;
    } else {
      headerHeight = 44;
    }
  } else if (Platform.OS === "android") {
    // headerHeight = 56;
    headerHeight = 20;
  } else {
    headerHeight = 64;
  }

  return headerHeight + statusBarHeight;
};

export const getBottomTabOffset = () => {
  return ifIphoneX(getBottomSpace() + 50, 52);
};

const window = Dimensions.get("window");
// Height of iPhone XS
const isSmallDevice = window.height < 812;
const statusBarHeight = getStatusBarHeight(true);
const stackHeaderHeight = getDefaultHeaderHeight(window, statusBarHeight);
const topOffset = statusBarHeight + stackHeaderHeight;
const bottomTabBarOffset = getBottomTabOffset();
const bottomTabBarHeight = 50 + (initialWindowSafeAreaInsets?.bottom || 0);

export {
  window,
  statusBarHeight,
  stackHeaderHeight,
  topOffset,
  isSmallDevice,
  bottomTabBarOffset,
  bottomTabBarHeight,
};
