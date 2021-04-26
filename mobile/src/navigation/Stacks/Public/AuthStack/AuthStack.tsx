import {
  PasswordReset,
  PasswordResetCode,
  PasswordResetNew,
  SignIn,
  SignUp,
  Start,
} from "../../../../screens";
import React, { useContext } from "react";

import { AuthStackParams } from "./AuthStackProps";
import { ThemeContext } from "../../../../contexts";
import { createStackNavigator } from "@react-navigation/stack";
import { generateNavigationOptions } from "../../../NavigationOptions";

const Stack = createStackNavigator<AuthStackParams>();

interface AuthStackProps {}

const AuthStack: React.FC<AuthStackProps> = ({}) => {
  const themeContextProps = useContext(ThemeContext);

  return (
    <Stack.Navigator
      initialRouteName="Start"
      screenOptions={generateNavigationOptions(themeContextProps)}
    >
      <Stack.Screen
        name="Start"
        component={Start}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SignIn"
        component={SignIn}
        options={{
          title: "Sign In",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUp}
        options={{
          title: "Sign Up",
        }}
      />
      <Stack.Screen
        name="PasswordReset"
        component={PasswordReset}
        options={{
          title: "Reset Password",
        }}
      />
      <Stack.Screen
        name="PasswordResetNew"
        component={PasswordResetNew}
        options={{
          title: "Reset Password",
        }}
      />
      <Stack.Screen
        name="PasswordResetCode"
        component={PasswordResetCode}
        options={{
          title: "Reset Password",
        }}
      />
    </Stack.Navigator>
  );
};
export default AuthStack;
