import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

export type AuthStackParams = {
  Start: undefined;
  SignIn: undefined;
  SignUp: undefined;
  PasswordReset: undefined;
  PasswordResetNew: { token: string; email: string };
  PasswordResetCode: { email: string };
};

export type AuthStackNavProps<T extends keyof AuthStackParams> = {
  navigation: StackNavigationProp<AuthStackParams, T>;
  route: RouteProp<AuthStackParams, T>;
};
