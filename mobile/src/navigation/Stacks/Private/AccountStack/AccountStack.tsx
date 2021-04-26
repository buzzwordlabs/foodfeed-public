import {
  Settings,
  AccountSettings,
  AppearanceSettings,
  BlockList,
  FAQ,
  Feedback,
  FollowList,
  Help,
  MoreAccountSettings,
  ViewPost,
  ViewLiveStream,
  EditableProfile,
  ViewPostComments,
  UneditableProfile,
} from "../../../../screens";
import React, { useContext } from "react";

import { AccountStackParams } from "./AccountStackProps";
import { ThemeContext, GlobalContext } from "../../../../contexts";
import { createStackNavigator } from "@react-navigation/stack";
import { generateNavigationOptions } from "../../../NavigationOptions";

const Stack = createStackNavigator<AccountStackParams>();

const AccountStack: React.FC<AccountStackParams> = ({}) => {
  const themeContextProps = useContext(ThemeContext);
  const global = useContext(GlobalContext);
  return (
    <Stack.Navigator
      initialRouteName="EditableProfile"
      screenOptions={generateNavigationOptions(themeContextProps)}
    >
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{ headerTitle: "" }}
      />
      <Stack.Screen name="ViewPost" component={ViewPost} />
      <Stack.Screen name="EditableProfile" component={EditableProfile} />
      <Stack.Screen name="UneditableProfile" component={UneditableProfile} />
      <Stack.Screen name="ViewLiveStream" component={ViewLiveStream} />
      <Stack.Screen name="ViewPostComments" component={ViewPostComments} />
      <Stack.Screen name="FollowList" component={FollowList} />
      <Stack.Screen
        name="MoreAccountSettings"
        component={MoreAccountSettings}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="BlockList"
        component={BlockList}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="Feedback"
        component={Feedback}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="AppearanceSettings"
        component={AppearanceSettings}
        options={{ title: "" }}
      />
      <Stack.Screen name="Help" component={Help} options={{ title: "" }} />
      <Stack.Screen name="FAQ" component={FAQ} />
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettings}
        options={{ title: "" }}
      />
    </Stack.Navigator>
  );
};
export default AccountStack;
