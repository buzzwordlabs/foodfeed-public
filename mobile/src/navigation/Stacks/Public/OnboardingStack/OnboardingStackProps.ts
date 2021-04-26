import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

export type OnboardingStackParams = {
  OnboardingManager: undefined;
  SelectInterests: undefined;
  NameGender: undefined;
};

export type OnboardingStackNavProps<T extends keyof OnboardingStackParams> = {
  navigation: StackNavigationProp<OnboardingStackParams, T>;
  route: RouteProp<OnboardingStackParams, T>;
};
