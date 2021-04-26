import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

export type SandboxStackParams = {
  Sandbox: undefined;
  NestedSandbox: undefined;
};

export type SandboxStackNavProps<T extends keyof SandboxStackParams> = {
  navigation: StackNavigationProp<SandboxStackParams, T>;
  route: RouteProp<SandboxStackParams, T>;
};
