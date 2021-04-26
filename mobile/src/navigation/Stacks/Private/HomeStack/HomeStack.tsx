import {
  FollowList,
  Home,
  UneditableProfile,
  ViewLiveStream,
  ViewPost,
  ViewPostComments,
  Search,
} from "../../../../screens";
import React, { useContext } from "react";

import { ThemeContext } from "../../../../contexts";
import { HomeStackParams } from "./HomeStackProps";
import { createStackNavigator } from "@react-navigation/stack";
import { generateNavigationOptions } from "../../../NavigationOptions";

const Stack = createStackNavigator<HomeStackParams>();

const HomeStack: React.FC<HomeStackParams> = ({}) => {
  const themeContextProps = useContext(ThemeContext);
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        ...generateNavigationOptions(themeContextProps),
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen
        name="Search"
        component={Search}
        options={{ headerShown: true, gestureEnabled: true }}
      />
      <Stack.Screen name="ViewLiveStream" component={ViewLiveStream} />
      <Stack.Screen name="UneditableProfile" component={UneditableProfile} />
      <Stack.Screen name="ViewPost" component={ViewPost} />
      <Stack.Screen name="ViewPostComments" component={ViewPostComments} />
      <Stack.Screen
        name="FollowList"
        component={FollowList}
        options={({ route }) => ({
          headerShown: true,
          title: route.params.username,
          gestureEnabled: true,
        })}
      />
    </Stack.Navigator>
  );
};
export default HomeStack;
