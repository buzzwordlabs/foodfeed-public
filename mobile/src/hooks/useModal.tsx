import {
  useModal as useDefaultModal,
  UsableModalProp,
} from "react-native-modalfy";
import { ModalStackParams } from "../components/Modals";

type UseModal = () => UsableModalProp<ModalStackParams>;

const useModal: UseModal = () => {
  const fns = useDefaultModal<ModalStackParams>();
  return fns;
};

export default useModal;
