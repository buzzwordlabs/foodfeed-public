import { Button, ParentView, Text, TextInputBox } from "../../components";
import { Keyboard, View } from "react-native";
import React, { useEffect, useState } from "react";
import { showBanner, validateEmail } from "../../utils";

import { AuthStackNavProps } from "../../navigation/Stacks/Public/AuthStack/AuthStackProps";
import { useLoadingRequest } from "../../hooks";

type Props = AuthStackNavProps<"PasswordReset">;

const PasswordReset = (props: Props) => {
  const [request, loading] = useLoadingRequest({ requireAuth: false });
  const [email, setEmail] = useState("");
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
    if (!validateEmail(email)) {
      return showBanner({
        message: "You cannot enter an empty or invalid email.",
        type: "danger",
      });
    }
    const response = await request({
      url: "/auth/password-reset/",
      method: "POST",
      body: { email },
    });
    if (response.ok) {
      showBanner({
        message: `You should receive an email with instructions if your email was valid.`,
        type: "success",
      });
      return props.navigation.push("PasswordResetCode", { email });
    } else {
      showBanner({ message: "Something went wrong.", type: "danger" });
    }
  };

  return (
    <ParentView>
      <View
        style={{
          justifyContent: "center",
          flex: 1,
          marginTop: 100,
        }}
      >
        <TextInputBox
          value={email}
          label="Email address"
          currentFocused={currentFocused}
          changeCurrentFocused={changeCurrentFocused}
          onChangeText={(changedEmail) => setEmail(changedEmail)}
          placeholder="Email address"
          autoCapitalize="none"
          autoCompleteType="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <Text style={{ marginTop: 10, marginBottom: 20 }}>
          We'll email you a 6 digit code to reset your password.
        </Text>
        <Button loading={loading} title="Send" onPress={submit} />
      </View>
    </ParentView>
  );
};

export default PasswordReset;
