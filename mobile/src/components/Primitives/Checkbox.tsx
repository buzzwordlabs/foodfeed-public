import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";

import { ThemeContext } from "../../contexts";
import Icon from "./Icon";
import { TouchableOpacity } from "react-native-gesture-handler";
import { tintColor } from "../../constants";

interface Props {
  onPress: () => void;
  selected: boolean;
  label: React.ReactNode;
}

const Checkbox = (props: Props) => {
  const { onPress, selected, label } = props;
  const { dividerColor } = useContext(ThemeContext);

  const size = 20;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        borderBottomWidth: 0,
        borderBottomColor: dividerColor,
        paddingVertical: 14,
      }}
    >
      <View
        style={[
          {
            width: size,
            height: size,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: tintColor,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          },
        ]}
      >
        {selected && (
          <View
            style={{
              width: size * 0.7,
              height: size * 0.7,
              backgroundColor: tintColor,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Icon
              library="materialComIcons"
              name="check"
              color="white"
              size={14}
            />
          </View>
        )}
      </View>
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        }}
      >
        {label}
      </View>
    </TouchableOpacity>
  );
};

export default Checkbox;
