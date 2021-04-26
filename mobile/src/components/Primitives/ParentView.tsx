import { Keyboard, Platform, ScrollView, View, ViewStyle } from "react-native";
import React, { useContext } from "react";
import {
  bottomTabBarHeight,
  defaultHorizontalInset,
  statusBarHeight,
} from "../../constants";

import { ThemeContext } from "../../contexts";

interface Props {
  style?: ViewStyle;
  wrapperStyle?: ViewStyle;
  scrollViewContentContainerStyle?: ViewStyle;
  children: any;
  noHeader?: boolean;
  noHorizontalPadding?: boolean;
  noScroll?: boolean;
  noBottomTabOffset?: boolean;
  safeBottomInset?: boolean;
  refreshControl?: any;
  HeaderComponent?: any;
  customHorizontalPadding?: number;
  onWrapperPress?: () => any;
}

const ParentView = (props: Props) => {
  const {
    children,
    style,
    noHeader,
    noHorizontalPadding,
    refreshControl,
    customHorizontalPadding,
    HeaderComponent,
    noScroll,
    wrapperStyle,
    scrollViewContentContainerStyle,
  } = props;
  const { backgroundColor } = useContext(ThemeContext);

  const resolveContentContainerStyle = () => {
    const style = [];
    if (customHorizontalPadding)
      style.push({ paddingHorizontal: customHorizontalPadding });
    else if (!noHorizontalPadding)
      style.push({ paddingHorizontal: defaultHorizontalInset });
    // if (safeBottomInset) style.push({ paddingBottom: (initialWindowSafeAreaInsets?.bottom || 0) + bottomTabBarOffset });
    style.push({ paddingBottom: bottomTabBarHeight });
    return style;
  };

  const resolveWrapperStyle = () => {
    const style: ViewStyle[] = [];
    // if (!noBottomTabOffset) style.push({ paddingBottom: bottomTabBarOffset });
    if (noHeader)
      style.push({
        paddingTop: Platform.OS === "ios" ? statusBarHeight : 0,
      });
    else style.push({ paddingTop: 10 });
    return style;
  };

  return (
    <View
      style={[
        { flex: 1, backgroundColor },
        ...resolveWrapperStyle(),
        wrapperStyle,
      ]}
    >
      {HeaderComponent}
      {noScroll ? (
        <View
          style={[
            ...resolveContentContainerStyle(),
            { backgroundColor, flex: 1 },
            style,
          ]}
        >
          {children}
        </View>
      ) : (
        <ScrollView
          onTouchMove={Keyboard.dismiss}
          contentContainerStyle={[...resolveContentContainerStyle(), style]}
          style={[{ backgroundColor }, scrollViewContentContainerStyle]}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
};

export default ParentView;
