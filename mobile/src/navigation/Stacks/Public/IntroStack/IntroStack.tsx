import React, { useContext } from "react";

import { ThemeContext } from "../../../../contexts";
import { Intro } from "../../../../screens";
import { IntroStackParams } from "./IntroStackProps";
import { createStackNavigator } from "@react-navigation/stack";
import { generateNavigationOptions } from "../../../NavigationOptions";

const Stack = createStackNavigator<IntroStackParams>();

interface IntroStackProps {}

const IntroStack: React.FC<IntroStackProps> = ({}) => {
  const themeContextProps = useContext(ThemeContext);
  return (
    <Stack.Navigator
      initialRouteName="Intro"
      screenOptions={generateNavigationOptions(themeContextProps)}
    >
      <Stack.Screen
        name="Intro"
        component={Intro}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
export default IntroStack;
