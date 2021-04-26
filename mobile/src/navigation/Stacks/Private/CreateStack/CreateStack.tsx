import {
  CreateLiveStream,
  ManageLiveStream,
  CreateRoot,
  CreatePostUploadMedia,
  CreatePostFinalize,
  CallsRoot,
  Call,
  WaitingRoom,
} from "../../../../screens";
import React, { useContext } from "react";

import { CreateStackParams } from "./CreateStackProps";
import { ThemeContext } from "../../../../contexts";
import { createStackNavigator } from "@react-navigation/stack";
import { generateNavigationOptions } from "../../../NavigationOptions";

const Stack = createStackNavigator<CreateStackParams>();

const CreateStack: React.FC<CreateStackParams> = ({}) => {
  const themeContextProps = useContext(ThemeContext);
  return (
    <Stack.Navigator
      initialRouteName="CreateRoot"
      screenOptions={{
        ...generateNavigationOptions(themeContextProps),
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen
        name="CreateRoot"
        component={CreateRoot}
        options={({ navigation }) => ({
          gestureEnabled: navigation.canGoBack(),
        })}
      />
      <Stack.Screen
        name="CreateLiveStream"
        component={CreateLiveStream}
        options={({ navigation }) => ({
          gestureEnabled: navigation.canGoBack(),
        })}
      />
      <Stack.Screen
        name="CreatePostUploadMedia"
        component={CreatePostUploadMedia}
        options={({ navigation }) => ({
          gestureEnabled: navigation.canGoBack(),
        })}
      />
      <Stack.Screen
        name="CreatePostFinalize"
        component={CreatePostFinalize}
        options={({ navigation }) => ({
          gestureEnabled: navigation.canGoBack(),
        })}
      />
      <Stack.Screen name="ManageLiveStream" component={ManageLiveStream} />
      <Stack.Screen
        name="CallsRoot"
        component={CallsRoot}
        options={{
          title: "Video Call",
          headerShown: true,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Call"
        component={Call}
        options={{ gestureEnabled: false, headerShown: false }}
      />
      <Stack.Screen
        name="WaitingRoom"
        component={WaitingRoom}
        options={{
          headerShown: true,
          gestureEnabled: true,
          title: "Waiting Room",
          headerBackTitle: "Back",
        }}
      />
    </Stack.Navigator>
  );
};
export default CreateStack;
