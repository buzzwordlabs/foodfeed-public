import {
  StreamContext,
  CallContext,
  GlobalContext,
  SocketContext,
  ThemeContext,
} from "../contexts";
import { bugsnag } from "../utils/bugsnag";
import { deleteCacheAll } from "../utils/cache";
import { request } from "../utils/request";
import { popup } from "../utils/popup";

import { useContext } from "react";
import { getUniqueId } from "react-native-device-info";

const useLogout = (): [
  ({ noPrompt }: { noPrompt: boolean }) => Promise<void>
] => {
  const global = useContext(GlobalContext);
  const stream = useContext(StreamContext);
  const call = useContext(CallContext);
  const socket = useContext(SocketContext);
  const { setTheme } = useContext(ThemeContext);
  const logout = async ({ noPrompt }: { noPrompt?: boolean }) => {
    const logoutLogic = async () => {
      try {
        request({
          url: "/user/auth/logout",
          method: "POST",
          body: { deviceId: getUniqueId() },
        }).catch((err) => {});
        if (stream?.state?.remoteStreamURL) stream?.endStream();
        if (call?.getCallPresent()) call?.localEndCall();
        if (socket?.state?.socket) socket?.killSocket();
        global?.setState({
          isLoggedIn: undefined,
          onboardingStep: undefined,
          authToken: "",
          firstName: "",
          lastName: "",
          username: "",
          avatar: "",
          bio: "",
          seenIntro: true,
        });
        setTheme("dark");
        await deleteCacheAll();
        bugsnag.clearUser();
      } catch (err) {}
    };
    if (!noPrompt) {
      popup({
        title: "Are you sure you want to sign out?",
        description: "",
        buttonOptions: [
          { text: "Cancel", onPress: () => {} },
          {
            text: "Logout",
            onPress: logoutLogic,
            style: "destructive",
          },
        ],
      });
    } else await logoutLogic();
  };
  return [logout];
};

export default useLogout;
