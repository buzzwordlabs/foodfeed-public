import React, { useRef, useEffect } from "react";
import { Modalize } from "react-native-modalize";

export type UseSlideUpReturnType = [
  React.RefObject<Modalize<any, any>>,
  () => void,
  () => void
];

const useSlideUp = (): UseSlideUpReturnType => {
  const ref = useRef<Modalize>(null);

  const onOpenSlideUp = () => ref.current?.open();

  const onCloseSlideUp = () => ref.current?.close();

  return [ref, onOpenSlideUp, onCloseSlideUp];
};

export default useSlideUp;
