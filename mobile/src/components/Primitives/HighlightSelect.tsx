import React, { useContext } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import { ThemeContext } from "../../contexts";
import Text from "./Text";

interface Props {
  id: string;
  title: string;
  onPress: (id: string) => void;
  selected: boolean;
}

const HighlightSelect = (props: Props) => {
  const { liftedBackgroundColor, tintColor, borderColor } = useContext(
    ThemeContext
  );
  const { id, title, onPress, selected } = props;

  const styles = StyleSheet.create({
    container: {
      alignSelf: "flex-start",
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginVertical: 7,
      marginHorizontal: 5,
      backgroundColor: selected ? tintColor : liftedBackgroundColor,
      borderColor: selected ? tintColor : borderColor,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 20,
    },
  });

  return (
    <TouchableOpacity onPress={() => onPress(id)} style={styles.container}>
      <Text w="bold">{title}</Text>
    </TouchableOpacity>
  );
};

export default HighlightSelect;
