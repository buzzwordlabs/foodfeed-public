import { Keyboard, View, ViewStyle } from "react-native";
import React, { forwardRef, useContext } from "react";
import { bottomTabBarOffset } from "../../constants";

import { ThemeContext } from "../../contexts";
import { IProps } from "react-native-modalize/lib/options";
import { Modalize } from "react-native-modalize";
import { Portal } from "react-native-portalize";
import { isIphoneX } from "../../constants/statusBar";
import { tinyVibration } from "../../utils";

type OverWrittenProps = {
  useNativeDriver?: boolean;
  handlePosition?: "outside" | "inside";
  dragToss?: number;
  threshold?: number;
  velocity?: number;
  modalStyle?: ViewStyle;
  disableScrollIfPossible?: boolean;
};

type CustomProps = {
  innerContainerStyle?: ViewStyle;
  justifyContentCenter?: boolean;
  isMandatory?: boolean;
};

export type SlideUpProps = Omit<IProps, keyof OverWrittenProps> &
  OverWrittenProps &
  CustomProps;

const SlideUp = forwardRef(
  (
    {
      innerContainerStyle,
      children,
      modalStyle,
      isMandatory,
      scrollViewProps,
      panGestureEnabled,
      justifyContentCenter,
      closeOnOverlayTap,
      onBackButtonPress,
      onOverlayPress,
      onClose,
      ...props
    }: SlideUpProps,
    ref: React.Ref<Modalize>
  ) => {
    const { backgroundColor } = useContext(ThemeContext);

    return (
      <Portal>
        <Modalize
          closeOnOverlayTap={
            onOverlayPress
              ? true
              : isMandatory
              ? false
              : closeOnOverlayTap ?? true
          }
          panGestureEnabled={isMandatory ? false : panGestureEnabled}
          onBackButtonPress={isMandatory ? () => {} : onBackButtonPress}
          onOverlayPress={onOverlayPress ? onOverlayPress : () => {}}
          onClose={onClose}
          ref={ref}
          modalStyle={[
            { backgroundColor },
            justifyContentCenter ? { flex: 1 } : {},
            modalStyle!,
          ]}
          scrollViewProps={{
            contentContainerStyle: [
              {
                ...scrollViewProps?.contentContainerStyle,
              },
              justifyContentCenter && { flex: 1, justifyContent: "center" },
            ],
            ...scrollViewProps,
          }}
          adjustToContentHeight
          disableScrollIfPossible
          {...props}
        >
          <View
            style={[
              {
                paddingHorizontal: 20,
                paddingVertical: 10,
                paddingBottom: bottomTabBarOffset - (isIphoneX() ? 40 : 0),
              },
              innerContainerStyle,
            ]}
          >
            {children}
          </View>
        </Modalize>
      </Portal>
    );
  }
);

export default SlideUp;
