import { NestedSandbox, Sandbox } from "../../../../screens";
import React, { useContext } from "react";

import { ThemeContext } from "../../../../contexts";
import { SandboxStackParams } from "./SandboxStackProps";
import { createStackNavigator } from "@react-navigation/stack";
import { generateNavigationOptions } from "../../../NavigationOptions";

const Stack = createStackNavigator<SandboxStackParams>();

const SandboxStack: React.FC<SandboxStackParams> = ({}) => {
  const themeContextProps = useContext(ThemeContext);
  return (
    <Stack.Navigator
      initialRouteName="Sandbox"
      screenOptions={generateNavigationOptions(themeContextProps)}
    >
      <Stack.Screen
        name="Sandbox"
        component={Sandbox}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="NestedSandbox" component={NestedSandbox} />
    </Stack.Navigator>
  );
};
export default SandboxStack;
