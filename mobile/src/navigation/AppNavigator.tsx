import { View } from "react-native";
import { AuthStack, IntroStack, OnboardingStack } from "./Stacks/Public";
import { GlobalContext, ThemeContext } from "../contexts";
import React, { useContext } from "react";

import BottomTabs from "./BottomTabNavigator/BottomTabNavigator";
import { LoadingIndicator } from "../components";
import Orientation from "react-native-orientation-locker";
import amplitude from "amplitude-js";

interface RouteProps {}

const AppNavigator: React.FC<RouteProps> = ({}) => {
  const global = useContext(GlobalContext);
  const { state: globalState } = global;
  const { backgroundColor } = useContext(ThemeContext);

  Orientation.lockToPortrait();

  if (globalState.authToken && globalState.username) {
    amplitude.setUserId(globalState.username);
  }

  return (
    <>
      {globalState.authToken ? (
        globalState.onboardingStep === undefined ? (
          <AuthStack />
        ) : globalState.onboardingStep === 0 ? (
          <BottomTabs />
        ) : (
          <OnboardingStack />
        )
      ) : globalState.seenIntro === true ? (
        <AuthStack />
      ) : globalState.seenIntro === false ? (
        <IntroStack />
      ) : (
        <View style={{ flex: 1, backgroundColor, justifyContent: "center" }}>
          <LoadingIndicator />
        </View>
      )}
    </>
  );
};

export default AppNavigator;
