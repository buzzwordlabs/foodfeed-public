import React from "react";
import { Text } from "../..";
import { TouchableOpacity } from "react-native";
import { shadowBox, tintColor } from "../../../constants";

export interface ModalButtonProps {
  title: string;
  onPress: () => void;
  danger?: boolean;
  outline?: boolean;
  highlight?: boolean;
  textOnly?: boolean;
}

const ModalButton = (props: ModalButtonProps) => {
  return (
    <TouchableOpacity
      style={{
        ...shadowBox,
        backgroundColor: props.textOnly
          ? "transparent"
          : props.highlight
          ? `${tintColor}ee`
          : props.outline
          ? "transparent"
          : "#151515",
        borderColor: props.outline ? "#161616" : "transparent",
        borderWidth: props.textOnly ? 0 : props.outline ? 3 : 0,
        borderRadius: 6,
        marginVertical: 6,
        paddingVertical: props.outline ? 10 : 13,
        paddingHorizontal: 14,
      }}
      onPress={props.onPress}
    >
      <Text w="extraBold" a="center" s="lg" t={props.danger ? "error" : "none"}>
        {props.title}
      </Text>
    </TouchableOpacity>
  );
};

export default ModalButton;
