import { Button, ParentView, PasswordField } from "../../components";
import { Keyboard, View } from "react-native";
import React, { useEffect, useState } from "react";
import { validatePassword } from "../../utils";

import { AuthStackNavProps } from "../../navigation";
import { showBanner } from "../../utils";
import { useRequest } from "../../hooks";

const initialState = {
  password: "",
  isLoading: false,
};

const PasswordResetNew = ({
  navigation,
  route,
}: AuthStackNavProps<"PasswordResetNew">) => {
  const [state, setState] = useState(initialState);
  const [request] = useRequest({ requireAuth: false });
  const { token, email } = route.params;
  const [currentFocused, setCurrentFocused] = useState("");
  const changeCurrentFocused = (fieldName: string) =>
    setCurrentFocused(fieldName);

  const keyboardWillHide = () => setCurrentFocused("");

  useEffect(() => {
    const keyboardWillHideListener = Keyboard.addListener(
      "keyboardWillHide",
      keyboardWillHide
    );
    return () => keyboardWillHideListener.remove();
  }, []);

  const submit = async () => {
    const { password } = state;
    if (password.length < 8 || password.length > 32) {
      return showBanner({
        message:
          "Your password is not greater than 8 characters but less than 32 characters.",
        type: "danger",
      });
    }
    setState({ ...state, isLoading: true });
    const response = await request({
      url: "/auth/password-reset/reset",
      method: "POST",
      body: { token, password, email },
    });
    setState({ ...state, isLoading: false });
    if (response.ok) {
      showBanner({
        message: "Your password has been successfully changed.",
        type: "success",
      });
      return navigation.popToTop();
    }
    return showBanner({
      message: "An error occurred.",
      type: "danger",
    });
  };

  return (
    <ParentView>
      <View style={{ marginTop: 100, justifyContent: "center", flex: 1 }}>
        <PasswordField
          label="Password"
          currentFocused={currentFocused}
          changeCurrentFocused={changeCurrentFocused}
          onChangeText={(password: string) => setState({ ...state, password })}
          value={state.password}
          showCheckbox={validatePassword(state.password)}
        />
        <Button
          style={{ marginTop: 20 }}
          loading={state.isLoading}
          title="Submit Password"
          onPress={submit}
        />
      </View>
    </ParentView>
  );
};

export default PasswordResetNew;
