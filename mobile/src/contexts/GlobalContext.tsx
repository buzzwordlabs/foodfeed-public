import React, { useEffect, useState } from "react";
import { bugsnag, readCacheMulti, writeCacheMulti, deviceId } from "../utils";

import SplashScreen from "react-native-splash-screen";
import { useRequest } from "../hooks";
import { getVersion } from "react-native-device-info";
import codePush from "react-native-code-push";

type ContextProps = {
  state: State;
  resetState: (stateSubset: SetStateArgs) => void;
  setState: (stateSubset: SetStateArgs) => void;
  saveUserInfo: (userInfo: SaveUserInfoArgs) => Promise<void>;
};

type SetStateArgs = Partial<State>;

interface SaveUserInfoArgs {
  authToken: string;
  firstName: string;
  lastName: string;
  username: string;
  bio: string;
  avatar: string;
  onboardingStep: number;
}

const GlobalContext = React.createContext<ContextProps>(
  (null as unknown) as ContextProps
);

interface State {
  isLoggedIn: boolean | undefined;
  onboardingStep: number | undefined;
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  authToken: string;
  bio: string;
  seenIntro: boolean | undefined;
  setupNotificationToken: boolean;
}

const initialState: State = {
  isLoggedIn: undefined,
  seenIntro: undefined,
  onboardingStep: undefined,
  setupNotificationToken: false,
  userId: "",
  authToken: "",
  firstName: "",
  lastName: "",
  username: "",
  bio: "",
  avatar: "",
};

interface Props {
  children: React.ReactNode;
}

const GlobalContextProvider = (props: Props) => {
  const [state, setState] = useState(initialState);
  const [request] = useRequest();

  useEffect(() => {
    SplashScreen.hide();
    (async () => {
      const { authToken, userId, username, seenIntro } = await readCacheMulti([
        "authToken",
        "userId",
        "username",
        "seenIntro",
      ]);
      if (authToken) {
        const appVersion = getVersion();
        const codePushMetadata = await codePush.getUpdateMetadata();
        const codePushVersion = codePushMetadata
          ? codePushMetadata.label
          : "v0";

        const response = await request({
          url: "/user/info",
          method: "POST",
          body: { deviceId, appVersion, codePushVersion },
        });
        // Request user info from server
        if (response.ok) {
          const {
            firstName,
            lastName,
            avatar,
            bio,
            onboardingStep,
            userId,
          } = response.data;
          bugsnag.setUser(userId, `${firstName} ${lastName}`);
          await writeCacheMulti([
            ["firstName", firstName],
            ["lastName", lastName],
            ["userId", userId],
            ["bio", bio],
            ["avatar", avatar],
            ["onboardingStep", onboardingStep],
          ]);
          setState({
            ...state,
            isLoggedIn: !!authToken,
            onboardingStep,
            authToken,
            userId,
            bio,
            firstName,
            lastName,
            avatar,
            username,
            seenIntro,
          });
        }
        // Read from cache
        else {
          const {
            firstName,
            lastName,
            bio,
            avatar,
            onboardingStep,
          } = await readCacheMulti([
            "firstName",
            "lastName",
            "avatar",
            "onboardingStep",
          ]);
          setState({
            ...state,
            isLoggedIn: !!authToken,
            onboardingStep,
            userId,
            authToken,
            bio,
            firstName,
            lastName,
            avatar,
            username,
            seenIntro,
          });
        }
      } else {
        setState({
          ...state,
          seenIntro: seenIntro ?? false,
        });
      }
    })();
  }, []);

  const resetState = (stateSubset?: SetStateArgs) =>
    setState({ ...initialState, ...stateSubset });

  const updateState = (stateSubset: SetStateArgs) =>
    setState({ ...state, ...stateSubset });

  const saveUserInfo = async ({
    authToken,
    firstName,
    lastName,
    username,
    avatar,
    bio,
    onboardingStep,
  }: SaveUserInfoArgs) => {
    await writeCacheMulti([
      ["authToken", authToken],
      ["firstName", firstName],
      ["lastName", lastName],
      ["username", username],
      ["bio", bio],
      ["avatar", avatar],
      ["onboardingStep", onboardingStep],
    ]);
    setState({
      ...state,
      authToken,
      isLoggedIn: true,
      firstName,
      lastName,
      avatar,
      bio,
      username,
      onboardingStep,
    });
  };

  return (
    <GlobalContext.Provider
      value={{
        state,
        resetState,
        saveUserInfo,
        setState: updateState,
      }}
    >
      {props.children}
    </GlobalContext.Provider>
  );
};

export { GlobalContext, GlobalContextProvider };
