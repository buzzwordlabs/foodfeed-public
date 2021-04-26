import {
  AMPLITUDE_LIFETIME_EVENTS,
  generateAmplitudeLoggedInConfig,
  getUserDeviceData,
  showBanner,
  validateEmail,
  validatePassword,
  validateUsername,
  writeCacheMulti,
  amplitude,
  amplitudeTrack,
  cleanOutgoingText,
  TOSUrl,
  privacyPolicyUrl,
} from "../../utils";
import {
  Button,
  PasswordField,
  Text,
  TextInputBox,
  SlideUp,
  Icon,
  WebViewSlideUp,
} from "../../components";
import { Keyboard, View, TouchableOpacity } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import {
  appName,
  gradientColors,
  tintColor,
  successColor,
  errorColor,
} from "../../constants";
import DatePicker from "react-native-date-picker";

import { AuthStackNavProps } from "../../navigation";
import ENV from "../../../env";
import { GlobalContext, ThemeContext } from "../../contexts";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useLoadingRequest, useSlideUp } from "../../hooks";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";
dayjs.extend(localizedFormat);
dayjs.extend(utc);

interface State {
  email: string;
  age: number | undefined;
  password: string;
  username: string;
  isLoading: boolean;
  keyboardOpen: boolean;
  birthdate: Date;
}

const initialState: State = {
  email: "",
  age: undefined,
  password: "",
  username: "",
  isLoading: false,
  keyboardOpen: false,
  birthdate: new Date(),
};

const SignUp = (props: AuthStackNavProps<"SignUp">) => {
  const global = useContext(GlobalContext);
  const { backgroundColor, borderColor } = useContext(ThemeContext);
  const [request, loading] = useLoadingRequest({ requireAuth: false });
  const [state, setState] = useState(initialState);
  const [currentFocused, setCurrentFocused] = useState("");
  const [datePickerRef, onOpenDatePicker] = useSlideUp();
  const [TOSWebViewRef, openTOSWebView, closeTOSWebView] = useSlideUp();
  const [
    privacyPolicyWebView,
    openPrivacyPolicyWebView,
    closePrivacyPolicyWebView,
  ] = useSlideUp();

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

  const updateBirthdate = (birthdate: Date) => {
    if (birthdate) setState({ ...state, birthdate });
  };

  const submit = async () => {
    const { email, password, username, birthdate } = state;
    const [cleanUsername, errorReason] = cleanOutgoingText({
      text: username,
      restrictProfane: true,
    });
    if (errorReason === "bad_words") {
      return showBanner({
        message: "Username cannot have profanity.",
        type: "danger",
      });
    }
    if (
      !validateUsername(cleanUsername) ||
      !validatePassword(password) ||
      !validateEmail(email)
    ) {
      return showBanner({
        message: `
          There's a problem with your sign up info.
        `,
        type: "danger",
      });
    }

    if (!isOver13(birthdate)) {
      return showBanner({
        message: `You must be at least 13 to use ${appName}`,
        type: "danger",
      });
    }

    const response = await request({
      url: "/auth/local/signup",
      method: "POST",
      body: {
        password,
        email,
        birthdate: pgStringDateFormat(birthdate),
        birthdateUTC: toUTC(birthdate),
        username: cleanUsername.toLowerCase(),
        deviceInfo: await getUserDeviceData(),
      },
    });

    if (response.ok) {
      if (response.data.authToken) {
        await saveUserInfo({
          authToken: response.data.authToken,
          userId: response.data.userId,
          username,
        });
      }
      return;
    } else {
      if (response.data?.errors?.length > 0) {
        if (response.data.errors[0].param === "username_taken")
          return showBanner({
            message: "That username is already taken.",
            type: "danger",
          });
      }
      if (response.status === 409)
        return showBanner({
          message: "That email is already taken.",
          type: "danger",
        });
      if (response.status === 400)
        return showBanner({
          message: "There was something wrong with your input.",
          type: "danger",
        });
      return showBanner({
        message: "An unknown error occurred.",
        type: "danger",
      });
    }
  };

  const saveUserInfo = async ({
    authToken,
    username,
    userId,
  }: {
    authToken: string;
    username: string;
    userId: string;
  }) => {
    await writeCacheMulti([
      ["authToken", authToken],
      ["username", username],
      ["onboardingStep", 1],
      ["userId", userId],
    ]);
    global.setState({
      ...state,
      authToken,
      userId,
      username,
      isLoggedIn: true,
      onboardingStep: 1,
    });
    if (userId) {
      amplitude.init(
        ENV.AMPLITUDE_API_KEY,
        userId,
        generateAmplitudeLoggedInConfig(userId)
      );
    }
    amplitudeTrack(AMPLITUDE_LIFETIME_EVENTS.sign_up_completed);
    amplitudeTrack(AMPLITUDE_LIFETIME_EVENTS.onboarding_started);
  };

  const isOver13 = (date: Date) => {
    const age = dayjs().diff(date, "year");
    return age >= 13 ? true : false;
  };

  const pgStringDateFormat = (date: Date) => dayjs(date).format("YYYY-MM-DD");

  const userFriendlyDateFormat = (date: Date) => dayjs(date).format("LL");

  const toUTC = (date: Date) => dayjs(date).utc().format();

  const resolveCheckbox = () => {
    if (isOver13(state.birthdate) === true)
      return (
        <Icon
          style={{ position: "absolute", top: 0, right: 0 }}
          library="materialComIcons"
          name="check"
          color={successColor}
          size={18}
        />
      );
    else if (isOver13(state.birthdate) === false)
      return (
        <Icon
          style={{ position: "absolute", top: 0, right: 0 }}
          library="feather"
          name="x"
          color={errorColor}
          size={18}
        />
      );
  };

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor }}
      contentContainerStyle={{ flex: 1, backgroundColor }}
    >
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <TextInputBox
          label="Username"
          currentFocused={currentFocused}
          changeCurrentFocused={changeCurrentFocused}
          placeholder="Username"
          onChangeText={(username: string) => setState({ ...state, username })}
          value={state.username}
          autoCompleteType="username"
          autoCapitalize="none"
          maxLength={20}
          showCharacterCountBottomRight
          description={
            "Usernames must be at least 3 characters and can contain only letters, numbers, underscores, and periods."
          }
          showCheckbox={validateUsername(state.username)}
          textContentType="username"
        />
        <TextInputBox
          label="Email address"
          currentFocused={currentFocused}
          changeCurrentFocused={changeCurrentFocused}
          placeholder="Email address"
          onChangeText={(email: string) => setState({ ...state, email })}
          value={state.email}
          autoCapitalize="none"
          autoCompleteType="email"
          keyboardType="email-address"
          showCharacterCountBottomRight
          showCheckbox={validateEmail(state.email)}
          textContentType="emailAddress"
        />
        <PasswordField
          onChangeText={(password: string) => setState({ ...state, password })}
          value={state.password}
          currentFocused={currentFocused}
          changeCurrentFocused={changeCurrentFocused}
          showCheckbox={validatePassword(state.password)}
          showCharacterCountBottomRight
        />
        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            changeCurrentFocused("Birthday");
            onOpenDatePicker();
          }}
          style={{
            borderWidth: 1,
            borderColor:
              currentFocused === "Birthday" ? tintColor : borderColor,
            height: 75,
            justifyContent: "space-between",
            borderRadius: 8,
            marginVertical: 10,
            backgroundColor,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
              marginHorizontal: 10,
            }}
          >
            <Text s="sm" w="bold">
              Birthday
            </Text>
            {resolveCheckbox()}
          </View>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              paddingHorizontal: 10,
            }}
          >
            <Text s="lg">{userFriendlyDateFormat(state.birthdate)}</Text>
          </View>
        </TouchableOpacity>
        <Text t="muted" linebreak>
          By continuing, you indicate that you are 13 or older, and agree to{" "}
          {appName}'s{" "}
          <Text onPress={openTOSWebView} t="highlight">
            Terms & Conditions{" "}
          </Text>
          and{" "}
          <Text onPress={openPrivacyPolicyWebView} t="highlight">
            Privacy Policy
          </Text>
        </Text>
        <Button
          style={{ alignSelf: "flex-end" }}
          loading={loading}
          gradientColors={gradientColors}
          title="Create Account"
          onPress={submit}
        />
      </View>
      <SlideUp
        ref={datePickerRef}
        withHandle={false}
        onClose={() => changeCurrentFocused("")}
      >
        <View style={{ alignItems: "center" }}>
          <DatePicker
            textColor="#ffffff"
            fadeToColor={backgroundColor}
            mode="date"
            maximumDate={new Date(new Date().getFullYear(), 11, 31)}
            minimumDate={new Date(1895, 0, 1)}
            date={state.birthdate}
            onDateChange={updateBirthdate}
          />
        </View>
      </SlideUp>
      <WebViewSlideUp
        ref={TOSWebViewRef}
        onPressClose={closeTOSWebView}
        uri={TOSUrl}
      />
      <WebViewSlideUp
        ref={privacyPolicyWebView}
        onPressClose={closePrivacyPolicyWebView}
        uri={privacyPolicyUrl}
      />
    </KeyboardAwareScrollView>
  );
};
export default SignUp;
