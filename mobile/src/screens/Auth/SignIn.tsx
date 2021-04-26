import {
  AMPLITUDE_LIFETIME_EVENTS,
  amplitudeTrack,
  amplitude,
  generateAmplitudeLoggedInConfig,
  getUserDeviceData,
  showBanner,
  writeCacheMulti,
} from "../../utils";
import FastImage from "react-native-fast-image";
import {
  Button,
  ParentView,
  PasswordField,
  Text,
  TextInputBox,
} from "../../components";
import { Keyboard, View, TouchableOpacity } from "react-native";
import React, { useContext, useEffect, useState } from "react";

import { AuthStackNavProps } from "../../navigation";
import ENV from "../../../env";
import { GlobalContext } from "../../contexts";
import { gradientColors } from "../../constants";
import { logoRectangleTransparent } from "../../assets/images";
import { useRequest } from "../../hooks";

const initialState = {
  usernameOrEmail: "",
  password: "",
  isLoading: false,
};

const SignIn = (props: AuthStackNavProps<"SignIn">) => {
  const global = useContext(GlobalContext);
  const [state, setState] = useState(initialState);
  const [request] = useRequest({ requireAuth: false });
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
    const { usernameOrEmail, password } = state;
    if (!usernameOrEmail)
      return showBanner({
        message: "Please supply a valid username or email.",
        type: "danger",
      });
    if (!password)
      return showBanner({
        message: "Please supply a password.",
        type: "danger",
      });

    setState({ ...state, isLoading: true });
    const response = await request({
      url: "/auth/local/signin",
      method: "POST",
      body: {
        usernameOrEmail,
        password,
        deviceInfo: await getUserDeviceData(),
      },
    });
    setState({ ...state, isLoading: false });
    if (response.ok) return saveUserInfo(response.data);
    else {
      return showBanner({
        message:
          response.status === 401
            ? "The username, email, or password provided is incorrect."
            : "An error occurred.",
        type: "danger",
      });
    }
  };

  const saveUserInfo = async ({
    authToken,
    userId,
    firstName,
    lastName,
    username,
    avatar,
    bio,
    onboardingStep,
  }: {
    authToken: string;
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar: string;
    bio: string;
    onboardingStep: number;
  }) => {
    await writeCacheMulti([
      ["authToken", authToken],
      ["userId", userId],
      ["firstName", firstName],
      ["lastName", lastName],
      ["username", username],
      ["avatar", avatar],
      ["bio", bio],
      ["onboardingStep", onboardingStep],
    ]);
    global.setState({
      ...state,
      authToken,
      userId,
      isLoggedIn: true,
      firstName,
      lastName,
      avatar,
      username,
      bio,
      onboardingStep,
    });
    if (userId) {
      amplitude.init(
        ENV.AMPLITUDE_API_KEY,
        userId,
        generateAmplitudeLoggedInConfig(userId)
      );
      amplitudeTrack(AMPLITUDE_LIFETIME_EVENTS.sign_in_completed);
    }
  };

  return (
    <ParentView noBottomTabOffset>
      <View>
        <FastImage
          source={logoRectangleTransparent}
          resizeMode="contain"
          style={{
            width: 250,
            height: 75,
            alignSelf: "center",
          }}
        />
        <View style={{ flexGrow: 5 }}>
          <View>
            <TextInputBox
              label="Email or username"
              currentFocused={currentFocused}
              changeCurrentFocused={changeCurrentFocused}
              onChangeText={(usernameOrEmail) =>
                setState({ ...state, usernameOrEmail })
              }
              value={state.usernameOrEmail}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ marginTop: 20 }}
            />
          </View>
          <View>
            <PasswordField
              currentFocused={currentFocused}
              changeCurrentFocused={changeCurrentFocused}
              onChangeText={(password: string) =>
                setState({ ...state, password })
              }
              value={state.password}
              label="Password"
              hideDescription
            />
          </View>
        </View>
        <TouchableOpacity
          onPress={() => props.navigation.push("PasswordReset")}
        >
          <Text a="left" t="highlight" style={{ marginTop: 10 }} linebreak>
            Forgot password?
          </Text>
        </TouchableOpacity>
      </View>
      <Button
        title="Login"
        loading={state.isLoading}
        gradientColors={gradientColors}
        onPress={submit}
      />
    </ParentView>
  );
};

export default SignIn;
