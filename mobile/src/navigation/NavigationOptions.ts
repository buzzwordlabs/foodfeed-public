import { muliBold, muliExtraBold, tintColor } from "../constants";
import { TransitionSpecs } from "@react-navigation/stack";
import { ContextProps as ThemeContextProps } from "../contexts";

export const customTransitionConfig = {
  ...TransitionSpecs.TransitionIOSSpec,
  config: { ...TransitionSpecs.TransitionIOSSpec.config, mass: 1 },
};

export const generateNavigationOptions = (theme: ThemeContextProps) => {
  const { textColor, backgroundColor } = theme;
  return {
    headerTitleStyle: {
      color: textColor,
      fontFamily: muliExtraBold,
    },
    headerBackTitleStyle: {
      fontFamily: muliBold,
    },
    headerLeftContainerStyle: {
      marginLeft: 10,
    },
    headerRightContainerStyle: {
      marginRight: 15,
    },
    headerBackTitleVisible: false,
    headerTintColor: tintColor,
    headerStyle: {
      backgroundColor,
      borderBottomWidth: 0,
      elevation: 0,
      shadowOffset: {
        height: 0,
        width: 0,
      },
    },
    transitionSpec: {
      open: customTransitionConfig,
      close: customTransitionConfig,
    },
    gestureResponseDistance: { vertical: 0 },
  };
};
