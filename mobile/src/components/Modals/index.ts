import GenericModal from "./GenericModal";
import UnblockModal from "./UnblockModal";

import { ModalComponentProp } from "react-native-modalfy";
import { GenericModalParams } from "./GenericModal";
import { UnblockModalParams } from "./UnblockModal";
import BlockModal, { BlockModalParams } from "./BlockModal";

export type BaseModalProps<T> = ModalComponentProp<
  ModalStackParams,
  void,
  T
> & {};

export interface ModalStackParams {
  GenericModal: GenericModalParams;
  UnblockModal: UnblockModalParams;
  BlockModal: BlockModalParams;
}

export default {
  GenericModal,
  UnblockModal,
  BlockModal,
};
