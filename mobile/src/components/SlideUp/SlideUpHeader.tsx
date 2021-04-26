import React, { useContext } from "react";
import { View, TouchableOpacity } from "react-native";
import GoBackButton from "../Video/GoBackButton";
import { ThemeContext } from "../../contexts";
import { Icon } from "../Primitives";

interface Props {
  onPressX: () => void;
  onPressGoBack?: () => void;
}

const Header = (props: Props) => {
  const { mutedText } = useContext(ThemeContext);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: props.onPressGoBack ? "space-between" : "flex-end",
        paddingVertical: 10,
      }}
    >
      {props.onPressGoBack && (
        <TouchableOpacity
          onPress={props.onPressGoBack}
          style={{ paddingLeft: 15, paddingRight: 15 }}
        >
          <GoBackButton
            onPress={props.onPressGoBack}
            size={30}
            color={mutedText}
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={{
          alignSelf: "flex-end",
          paddingVertical: 5,
          paddingLeft: 5,
          paddingRight: 10,
        }}
        onPress={props.onPressX}
      >
        <Icon library={"antdesign"} name={"close"} size={28} />
      </TouchableOpacity>
    </View>
  );
};

export default Header;
