import {
  NameGender,
  OnboardingManager,
  SelectInterests,
} from "../../../../screens";
import React, { useContext } from "react";

import { ThemeContext } from "../../../../contexts";
import { OnboardingStackParams } from "./OnboardingStackProps";
import { createStackNavigator } from "@react-navigation/stack";
import { generateNavigationOptions } from "../../../NavigationOptions";

const Stack = createStackNavigator<OnboardingStackParams>();

interface OnboardingStackProps {}

const OnboardingStack: React.FC<OnboardingStackProps> = ({}) => {
  const themeContextProps = useContext(ThemeContext);
  return (
    <Stack.Navigator
      initialRouteName="OnboardingManager"
      screenOptions={{
        ...generateNavigationOptions(themeContextProps),
        gestureEnabled: false,
      }}
    >
      <Stack.Screen
        name="OnboardingManager"
        component={OnboardingManager}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NameGender"
        component={NameGender}
        options={{ title: "Info" }}
      />
      <Stack.Screen name="SelectInterests" component={SelectInterests} />
    </Stack.Navigator>
  );
};
export default OnboardingStack;
