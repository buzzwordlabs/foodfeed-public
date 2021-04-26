import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

export type IntroStackParams = {
  Intro: undefined;
};

export type IntroStackNavProps<T extends keyof IntroStackParams> = {
  navigation: StackNavigationProp<IntroStackParams, T>;
  route: RouteProp<IntroStackParams, T>;
};
