import {
  AMPLITUDE_LIFETIME_EVENTS,
  amplitudeTrack,
  showBanner,
  validatePersonName,
  writeCache,
  writeCacheMulti,
} from "../../utils";
import {
  Button,
  ParentView,
  Select,
  TextInputBox,
  HeaderTextButton,
} from "../../components";
import { Keyboard, View } from "react-native";
import React, { useContext, useEffect, useState } from "react";

import { GlobalContext } from "../../contexts";
import { OnboardingStackNavProps } from "../../navigation";
import { gradientColors } from "../../constants";
import { useLoadingRequest, useLogout } from "../../hooks";

type Props = OnboardingStackNavProps<"OnboardingManager">;

interface State {
  firstName: string;
  lastName: string;
  gender: "placeholder" | "M" | "F" | "O" | "U";
}

const initialState: State = {
  firstName: "",
  lastName: "",
  gender: "placeholder",
};

const UserInfo = (props: Props) => {
  const global = useContext(GlobalContext);
  const [state, setState] = useState(initialState);
  const [currentFocused, setCurrentFocused] = useState("");
  const [request, loading] = useLoadingRequest();
  const [logout] = useLogout();

  props.navigation.setOptions({
    headerRight: () => (
      <HeaderTextButton
        onPress={() => logout({ noPrompt: false })}
        title="Sign Out"
      />
    ),
    headerLeft: () => <></>,
  });

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
    const { firstName, lastName, gender } = state;
    if (
      !validatePersonName(firstName) ||
      !validatePersonName(lastName) ||
      gender === "placeholder"
    ) {
      return showBanner({
        message: `
          There's a problem with your sign up info.
        `,
        type: "danger",
      });
    }

    const response = await request({
      url: "/user/onboarding/name-gender",
      method: "POST",
      body: {
        firstName,
        lastName,
        gender,
      },
    });

    if (response.ok) {
      await saveUserInfo({ firstName, lastName });
      await writeCache("onboardingStep", 2);
      amplitudeTrack(
        AMPLITUDE_LIFETIME_EVENTS.onboarding_completed_name_gender,
        { onboardingStep: 1 }
      );
      props.navigation.push("SelectInterests");
      return;
    } else {
      return showBanner({
        message: "An unknown error occurred.",
        type: "danger",
      });
    }
  };

  const saveUserInfo = async ({
    firstName,
    lastName,
  }: {
    firstName: string;
    lastName: string;
  }) => {
    await writeCacheMulti([
      ["firstName", firstName],
      ["lastName", lastName],
    ]);
    global.setState({
      ...state,
      isLoggedIn: true,
      firstName,
      lastName,
    });
  };

  return (
    <ParentView style={{ flex: 1 }} noBottomTabOffset>
      <View style={{ flex: 1 }}>
        <TextInputBox
          label="First Name"
          currentFocused={currentFocused}
          changeCurrentFocused={changeCurrentFocused}
          placeholder="First Name"
          onChangeText={(firstName) => setState({ ...state, firstName })}
          value={state.firstName}
          maxLength={30}
          autoCompleteType="name"
          showCharacterCountBottomRight
          showCheckbox={validatePersonName(state.firstName)}
          textContentType="givenName"
        />
        <TextInputBox
          currentFocused={currentFocused}
          changeCurrentFocused={changeCurrentFocused}
          label="Last Name"
          placeholder="Last Name"
          onChangeText={(lastName) => setState({ ...state, lastName })}
          value={state.lastName}
          maxLength={30}
          autoCompleteType="name"
          showCharacterCountBottomRight
          showCheckbox={validatePersonName(state.lastName)}
          textContentType="familyName"
        />
        <Select
          currentFocused={currentFocused}
          label="Gender"
          showCheckbox={state.gender !== "placeholder"}
          changeCurrentFocused={changeCurrentFocused}
          onValueChange={(gender) => setState({ ...state, gender })}
          placeholder={{ label: "Pick a gender...", value: "placeholder" }}
          value={state.gender}
          items={[
            { label: "Male", value: "M" },
            { label: "Female", value: "F" },
            { label: "Other", value: "O" },
            { label: "Would rather not say", value: "U" },
          ]}
        />
        <Button
          style={{ alignSelf: "flex-end", marginTop: 50 }}
          loading={loading}
          gradientColors={gradientColors}
          title="Continue"
          onPress={submit}
        />
      </View>
    </ParentView>
  );
};

export default UserInfo;
