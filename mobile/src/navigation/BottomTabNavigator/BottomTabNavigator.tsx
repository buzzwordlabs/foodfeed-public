import {
  AccountStack,
  ConversationsStack,
  CreateStack,
  HomeStack,
  SandboxStack,
  ActivityStack,
} from "../Stacks";
import { Avatar, TabBarIcon } from "../../components";
import { BottomTabParamList, BottomTabRoutes } from "./BottomTabParamList";
import { Platform, View } from "react-native";
import React, { useContext } from "react";
import { bottomTabBarHeight, tintColor, shadowBox } from "../../constants";

import { GlobalContext, ThemeContext } from "../../contexts";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { customTransitionConfig } from "../NavigationOptions";
import { isIphoneX } from "../../constants/statusBar";
import { BadgeContext } from "../../contexts/BadgeContext";

const Tabs = createBottomTabNavigator<BottomTabParamList>();

interface BottomTabProps {}

const NO_TAB_BAR_ROUTES: BottomTabRoutes[] = [
  "ViewLiveStream",
  "ManageLiveStream",
  "Call",
  "WaitingRoom",
  "CreatePostUploadMedia",
  "CreatePostFinalize",
  "ViewPost",
  "ViewPostComments",
  "Conversation",
  "Sandbox",
];

const getTabBarVisible = (route: any) => {
  const routeObject = route.state
    ? route.state.routes[route.state.index]
    : route.params?.screen;
  const routeName: BottomTabRoutes = route.state
    ? route.state.routes[route.state.index].name
    : route.params?.screen;

  // Hide tab bar in CreateLiveStream in Home
  if (routeName === "CreateLiveStream" && routeObject?.params?.canGoBack) {
    return false;
  }

  return !NO_TAB_BAR_ROUTES.includes(routeName);
};

const BottomTabs: React.FC<BottomTabProps> = () => {
  const global = useContext(GlobalContext);
  const {
    state: { avatar },
  } = global;

  const { tabIconSelected, tabIconUnselected, tabBarColor } = useContext(
    ThemeContext
  );

  return (
    <Tabs.Navigator
      initialRouteName="HomeStack"
      screenOptions={({ route }) => {
        return {
          transitionSpec: {
            open: customTransitionConfig,
            close: customTransitionConfig,
          },
          tabBarIcon: ({ focused }) =>
            resolveTabBarIcon(route.name, focused, avatar),
        };
      }}
      tabBarOptions={{
        activeTintColor: tabIconSelected,
        inactiveTintColor: tabIconUnselected,
        allowFontScaling: false,
        showLabel: false,
        keyboardHidesTabBar: true,
        style: {
          backgroundColor: tabBarColor,
          marginVertical: 4,
          marginHorizontal: 10,
          height: isIphoneX() ? bottomTabBarHeight - 20 : bottomTabBarHeight,
          borderRadius: isIphoneX() ? 20 : 12.5,
          bottom: isIphoneX() ? 20 : 5,
          borderTopWidth: 0,
          position: "absolute",
          paddingBottom: 0,
          ...shadowBox,
        },
      }}
    >
      <Tabs.Screen
        name="HomeStack"
        component={HomeStack}
        options={({ route }) => ({
          tabBarVisible: getTabBarVisible(route),
        })}
      />
      <Tabs.Screen
        name="ConversationsStack"
        component={ConversationsStack}
        options={({ route }) => ({
          tabBarVisible: getTabBarVisible(route),
        })}
      />
      <Tabs.Screen
        name="CreateStack"
        component={CreateStack}
        options={({ route }) => ({
          tabBarVisible: getTabBarVisible(route),
        })}
      />
      <Tabs.Screen
        name="ActivityStack"
        component={ActivityStack}
        options={({ route }) => ({
          tabBarVisible: getTabBarVisible(route),
        })}
      />
      <Tabs.Screen name="AccountStack" component={AccountStack} />
      {/* <Tabs.Screen
        name="SandboxStack"
        component={SandboxStack}
        options={({ route }) => ({
          tabBarVisible: getTabBarVisible(route),
        })}
      /> */}
    </Tabs.Navigator>
  );
};

const resolveTabBarIcon = (
  routeName: keyof BottomTabParamList,
  focused: boolean,
  avatar: string
) => {
  const { badgeStatusState } = useContext(BadgeContext);
  switch (routeName) {
    case "AccountStack":
      if (avatar)
        return (
          <>
            <View
              style={{
                borderColor: focused ? tintColor : "transparent",
                borderWidth: 1,
                borderRadius: 25,
              }}
            >
              <Avatar
                style={{ width: 24, height: 24, margin: 1 }}
                avatar={avatar}
              />
            </View>
          </>
        );
      return (
        <TabBarIcon
          focused={focused}
          library="antdesign"
          name="smileo"
          size={26}
        />
      );
    case "ConversationsStack":
      return (
        <TabBarIcon
          focused={focused}
          library="antdesign"
          name="message1"
          style={{ transform: [{ scaleY: -1 }, { rotate: "180deg" }] }}
          size={24}
          badgeNumber={badgeStatusState.conversations}
          badgeStyle={{ right: -10 }}
        />
      );
    case "HomeStack":
      return (
        <TabBarIcon
          focused={focused}
          name="home"
          library="antdesign"
          size={28}
        />
      );
    case "CreateStack":
      return (
        <TabBarIcon
          focused={focused}
          library="antdesign"
          name="plussquareo"
          size={26}
        />
      );
    case "ActivityStack":
      return (
        <TabBarIcon
          focused={focused}
          name="inbox"
          library="antdesign"
          size={28}
          badgeNumber={badgeStatusState.activity}
          badgeStyle={{ right: -5 }}
        />
      );
    case "SandboxStack":
      return <TabBarIcon focused={focused} name="box" library="feather" />;
    default:
      return (
        <TabBarIcon focused={focused} name="warning" library="antdesign" />
      );
  }
};

export default BottomTabs;
