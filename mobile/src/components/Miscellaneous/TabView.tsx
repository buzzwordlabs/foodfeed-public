import {
  TabView as DefaultTabView,
  TabBar,
  TabViewProps,
  Route,
} from "react-native-tab-view";
import { tintColor, window } from "../../constants";
import { Text } from "../Primitives";
import { ThemeContext } from "../../contexts";
import React from "react";

interface Props
  extends Pick<
    TabViewProps<Route>,
    "onIndexChange" | "initialLayout" | "navigationState" | "style"
  > {
  renderScene: ({ route: { key } }: { route: { key: any } }) => React.ReactNode;
  lazy?: boolean;
}

const TabView = ({
  renderScene,
  onIndexChange,
  navigationState,
  style,
  lazy,
}: Props) => {
  const { backgroundColor } = React.useContext(ThemeContext);
  return (
    <DefaultTabView
      lazy={!!lazy}
      style={[{ borderTopColor: "#535353" }, style || {}]}
      renderTabBar={(props) => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: tintColor }}
          style={{ backgroundColor: backgroundColor }}
          renderLabel={({ route, focused }) => (
            <Text w="bold" t={focused ? "none" : "muted"}>
              {route.title}
            </Text>
          )}
        />
      )}
      navigationState={navigationState}
      renderScene={renderScene}
      onIndexChange={onIndexChange}
      initialLayout={{ width: window.width }}
    />
  );
};

export default TabView;
