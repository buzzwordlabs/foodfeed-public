import React, { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";

type CloseSlideUpFunctions = (() => void)[];

const useSlideUpFocusManager = (
  closeSlideUpFunctions: CloseSlideUpFunctions
) => {
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      closeSlideUpFunctions.forEach((fn) => fn());
    }
  }, [isFocused]);
};

export default useSlideUpFocusManager;
