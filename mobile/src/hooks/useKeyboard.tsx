import { Keyboard, KeyboardEvent, Platform } from "react-native";
import { useEffect, useState } from "react";

const useKeyboard = (): [boolean, number] => {
  const [state, setState] = useState({
    keyboardHeight: 0,
    keyboardShown: false,
  });

  const onKeyboardDidShow = (e: KeyboardEvent) =>
    setState({
      keyboardHeight: e.endCoordinates.height,
      keyboardShown: true,
    });

  const onKeyboardDidHide = () =>
    setState({ keyboardHeight: 0, keyboardShown: false });

  useEffect(() => {
    Keyboard.addListener("keyboardWillShow", onKeyboardDidShow);
    Keyboard.addListener("keyboardWillHide", onKeyboardDidHide);
    return () => {
      Keyboard.removeListener("keyboardWillShow", onKeyboardDidShow);
      Keyboard.removeListener("keyboardWillHide", onKeyboardDidHide);
    };
  }, []);

  return [state.keyboardShown, state.keyboardHeight];
};

export default useKeyboard;
