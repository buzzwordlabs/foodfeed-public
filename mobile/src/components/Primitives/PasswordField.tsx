import React, { useState } from "react";
import TextInputBox, { TextInputBoxProps } from "./TextInputBox";

import Icon from "./Icon";
import { Platform } from "react-native";

type OverrideTextInputBoxProps = Omit<TextInputBoxProps, "label"> & {
  label?: string;
  hideDescription?: boolean;
};

export default function PasswordField(props: OverrideTextInputBoxProps) {
  const [showPassword, setShowPassword] = useState(false);
  const renderIcon = () => {
    if (showPassword) {
      return Platform.select({
        ios: <PasswordFieldIcon name="ios-eye-off" />,
        android: <PasswordFieldIcon name="md-eye-off" />,
      });
    } else {
      return Platform.select({
        ios: <PasswordFieldIcon name="ios-eye" />,
        android: <PasswordFieldIcon name="md-eye" />,
      });
    }
  };

  const PasswordFieldIcon = ({ name }: { name: string }) => {
    return (
      <Icon
        library="ionicons"
        name={name}
        color="gray"
        size={20}
        style={{ marginHorizontal: 10 }}
        onPress={() => setShowPassword(!showPassword)}
      />
    );
  };

  return (
    <TextInputBox
      placeholder={props.placeholder || "Password"}
      secureTextEntry={!showPassword}
      autoCompleteType="password"
      maxLength={100}
      icon={renderIcon()}
      label="Password"
      description={
        !props.hideDescription
          ? "Passwords must be at least 8 characters long, less than 100 characters, have 1 capital letter, and 1 number."
          : undefined
      }
      {...props}
    />
  );
}
