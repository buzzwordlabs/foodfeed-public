import {
  FollowList,
  ViewPost,
  ViewLiveStream,
  ViewPostComments,
  UneditableProfile,
  Activity,
} from "../../../../screens";
import React, { useContext } from "react";

import { ActivityStackParams } from "./ActivityStackProps";
import { ThemeContext } from "../../../../contexts";
import { createStackNavigator } from "@react-navigation/stack";
import { generateNavigationOptions } from "../../../NavigationOptions";

const Stack = createStackNavigator<ActivityStackParams>();

const ActivityStack: React.FC<ActivityStackParams> = ({}) => {
  const themeContextProps = useContext(ThemeContext);
  return (
    <Stack.Navigator
      initialRouteName="Activity"
      screenOptions={generateNavigationOptions(themeContextProps)}
    >
      <Stack.Screen
        name="Activity"
        component={Activity}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="ViewPost" component={ViewPost} />
      <Stack.Screen name="ViewPostComments" component={ViewPostComments} />
      <Stack.Screen name="ViewLiveStream" component={ViewLiveStream} />
      <Stack.Screen name="UneditableProfile" component={UneditableProfile} />
      <Stack.Screen name="FollowList" component={FollowList} />
    </Stack.Navigator>
  );
};
export default ActivityStack;
