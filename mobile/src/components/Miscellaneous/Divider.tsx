import React, { useContext } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { ThemeContext } from "../../contexts";

interface Props {
  direction: "vertical" | "horizontal";
  style?: ViewStyle;
}

const Divider = React.memo((props: Props) => {
  const { borderColor } = useContext(ThemeContext);
  return (
    <View
      style={[
        { borderColor },
        props.direction === "vertical"
          ? { borderRightWidth: StyleSheet.hairlineWidth }
          : { borderBottomWidth: StyleSheet.hairlineWidth },
        props.style,
      ]}
    />
  );
});

export default Divider;
