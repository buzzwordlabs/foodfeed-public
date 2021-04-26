import React, { useContext, useEffect } from "react";

import { ThemeContext, GlobalContext } from "../../contexts";
import { OnboardingStackNavProps } from "../../navigation";
import { View } from "react-native";

type Props = OnboardingStackNavProps<"OnboardingManager">;

export const OnboardingStepsMap: { [step: number]: OnboardingStepsType } = {
  1: "NameGender",
  2: "SelectInterests",
};

type OnboardingStepsType = "NameGender" | "SelectInterests";

const OnboardingManager = (props: Props) => {
  const global = useContext(GlobalContext);
  const { backgroundColor } = useContext(ThemeContext);

  useEffect(() => {
    setTimeout(() => {
      const route = OnboardingStepsMap[global.state.onboardingStep ?? 1];
      return props.navigation.navigate(route);
    }, 100);
  }, []);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor,
      }}
    />
  );
};

export default OnboardingManager;
