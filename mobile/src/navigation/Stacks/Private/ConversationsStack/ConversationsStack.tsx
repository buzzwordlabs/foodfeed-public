import {
  Conversations,
  Conversation,
  FollowList,
  ViewPost,
  ViewPostComments,
  ViewLiveStream,
  UneditableProfile,
  CreateConversation,
} from "../../../../screens";
import React, { useContext } from "react";

import { ConversationsStackParams } from "./ConversationsStackProps";
import { ThemeContext } from "../../../../contexts";
import { createStackNavigator } from "@react-navigation/stack";
import { generateNavigationOptions } from "../../../NavigationOptions";

const Stack = createStackNavigator<ConversationsStackParams>();

const ConversationsStack: React.FC<ConversationsStackParams> = (...props) => {
  const themeContextProps = useContext(ThemeContext);
  return (
    <Stack.Navigator
      initialRouteName="Conversations"
      screenOptions={{
        ...generateNavigationOptions(themeContextProps),
      }}
    >
      <Stack.Screen
        name="Conversations"
        component={Conversations}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Conversation" component={Conversation} />
      <Stack.Screen name="ViewPost" component={ViewPost} />
      <Stack.Screen name="ViewPostComments" component={ViewPostComments} />
      <Stack.Screen name="ViewLiveStream" component={ViewLiveStream} />
      <Stack.Screen name="UneditableProfile" component={UneditableProfile} />
      <Stack.Screen name="FollowList" component={FollowList} />
      <Stack.Screen name="CreateConversation" component={CreateConversation} />
    </Stack.Navigator>
  );
};
export default ConversationsStack;
