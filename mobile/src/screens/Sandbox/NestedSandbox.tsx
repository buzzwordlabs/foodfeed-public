import { ParentView, Text } from "../../components";
import React from "react";

import { View } from "react-native";

const NestedSandbox = () => {
  return (
    <ParentView>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text a="center">Hello Screen</Text>
      </View>
    </ParentView>
  );
};

export default NestedSandbox;
