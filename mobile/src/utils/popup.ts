import { AlertButton, Alert as DefaultAlert, Platform } from "react-native";

import { appName } from "./../constants/names";
import { redirectSettings } from "./linking";

export interface PopupArgs {
  title?: string;
  description?: string;
  buttonOptions?: AlertButton[];
}

const popup = ({
  title = "Placeholder Title",
  description = "",
  buttonOptions = [{ text: "Okay", onPress: () => {} }],
}: PopupArgs) => {
  return DefaultAlert.alert(title, description, buttonOptions);
};

const popupPermissionsPrompt = () => {
  popup({
    title: "Enable Permissions",
    description:
      Platform.OS === "ios"
        ? `Please enable contacts, notifications, and microphone permissions.\n\\${appName} won't work without these.`
        : `Please enable contacts, audio, and phone state permissions.\n\\${appName} won't work without these.`,
    buttonOptions: [{ text: "Allow", onPress: redirectSettings }],
  });
};

export { popup, popupPermissionsPrompt };
