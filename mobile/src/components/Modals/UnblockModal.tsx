import React from "react";
import Text from "../Primitives/Text";
import { View } from "react-native";
import { useRequest } from "../../hooks";
import { debounce } from "lodash";
import ModalButton from "./components/ModalButton";
import { BaseModalProps } from "./";
import { Callback } from "../../utils";
import { ModalContainer } from "./components";

export interface UnblockModalParams {
  submit?: (username: string) => Promise<void>;
  username: string;
  onCancelCallback?: Callback;
  onSubmitCallback?: Callback;
  onSuccessCallback?: Callback;
  onFailCallback?: Callback;
}

type Props = BaseModalProps<"UnblockModal">;

const UnblockModal = (props: Props) => {
  const [request] = useRequest();

  const submitDefault = debounce(async () => {
    const response = await request({
      url: "/user/tattle/unblock",
      method: "DELETE",
      body: { username: props.modal.params?.username },
    });
    if (response.ok) props.modal.params?.onSubmitCallback?.();
    else props.modal.params?.onFailCallback?.();
  }, 500);

  // TODO: Handle fail and submit callbacks
  const submitHandler = async () => {
    props.modal.params?.submit
      ? props.modal.params?.submit(props.modal.params?.username)
      : submitDefault();
    props.modal.closeModal("UnblockModal");
    props.modal.params?.onSubmitCallback?.();
  };

  return (
    <ModalContainer>
      <View>
        <View>
          <Text a="center" s="subHeader" w="bold" style={{ marginBottom: 30 }}>
            Unblock {props.modal.params?.username} 🔓
          </Text>
          <Text w="semiBold" s="lg" linebreak>
            Are you sure you'd like to unblock{" "}
            {props.modal.params?.username || "this person"}?
          </Text>
        </View>
        <View>
          <ModalButton highlight title="Unblock User" onPress={submitHandler} />
          <ModalButton
            textOnly
            title="Cancel"
            onPress={() => {
              props.modal.closeModal("UnblockModal");
              props.modal.params?.onCancelCallback?.();
            }}
          />
        </View>
      </View>
    </ModalContainer>
  );
};

export default UnblockModal;
