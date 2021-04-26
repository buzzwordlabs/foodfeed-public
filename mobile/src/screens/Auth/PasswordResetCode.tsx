import { Button, ParentView, Text, TextInputBox } from "../../components";
import { Keyboard, View } from "react-native";
import React, { useEffect, useState } from "react";

import { AuthStackNavProps } from "../../navigation";
import { showBanner } from "../../utils";
import { useLoadingRequest } from "../../hooks";

const PasswordResetCode = (props: AuthStackNavProps<"PasswordResetCode">) => {
  const { email } = props.route.params;
  const [request, loading] = useLoadingRequest({ requireAuth: false });
  const [token, setToken] = useState("");
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

  return (
    <ParentView>
      <View style={{ justifyContent: "center", flex: 1 }}>
        <TextInputBox
          style={{ marginTop: 100 }}
          label="Code"
          currentFocused={currentFocused}
          changeCurrentFocused={changeCurrentFocused}
          onChangeText={(newToken) => setToken(newToken)}
          value={token}
          placeholder="Six Digit Code"
          keyboardType="numeric"
          maxLength={6}
        />
        <Text linebreak>
          You should receive an email with the 6 digit reset code shortly.
        </Text>
        <Button
          loading={loading}
          title="Submit Code"
          onPress={async () => {
            if (token.length !== 6) {
              return showBanner({
                message: "Your code must be exactly 6 digits.",
                type: "danger",
              });
            }
            const response = await request({
              url: "/auth/password-reset/token",
              method: "POST",
              body: {
                email,
                token,
              },
            });
            if (response.ok) {
              return props.navigation.push("PasswordResetNew", {
                token,
                email,
              });
            }
            if (response.status === 401) {
              return showBanner({
                message: "Your code was either incorrect or expired.",
                type: "danger",
              });
            }
            return showBanner({
              message: "An error occurred. Please try again.",
              type: "danger",
            });
          }}
        />
      </View>
    </ParentView>
  );
};

export default PasswordResetCode;
