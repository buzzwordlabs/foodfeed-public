import React from "react";
import { View } from "react-native";
import { Text } from "../Primitives";
import { BaseModalProps } from "./";
import ModalContainer from "./components/ModalContainer";
import ModalButton, { ModalButtonProps } from "./components/ModalButton";

export interface GenericModalParams {
  title: string;
  description: string;
  options: ModalButtonProps[];
  hero?: string;
  IconComponent?: React.ReactNode;
}

type Props = BaseModalProps<"GenericModal">;

const GenericModal = (props: Props) => {
  return (
    <ModalContainer>
      <View>
        <View>
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Text s="xxl" a="center" w="bold">
              {props.modal.params?.title}
            </Text>
            {props.modal.params?.IconComponent}
          </View>
          <Text w="semiBold" style={{ marginTop: 20 }} a="center">
            {props.modal.params?.description}
          </Text>
        </View>
        <View style={{ marginTop: 20 }}>
          {props.modal.params?.options.map((b, key) => (
            <ModalButton key={key} {...b} />
          ))}
        </View>
      </View>
    </ModalContainer>
  );
};

export default GenericModal;
