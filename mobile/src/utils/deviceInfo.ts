import {
  getModel,
  getSystemVersion,
  getUniqueId,
  getVersion,
} from "react-native-device-info";

import { Platform } from "react-native";
import codePush from "react-native-code-push";

const deviceId = getUniqueId();

const getUserDeviceData = async () => {
  const platform = Platform.OS;
  const appVersion = getVersion();
  const codePushMetadata = await codePush.getUpdateMetadata();
  const codePushVersion = codePushMetadata && codePushMetadata.label;
  const systemModel = getModel();
  const systemVersion = getSystemVersion();
  return {
    platform,
    appVersion,
    codePushVersion,
    systemModel,
    systemVersion,
    deviceId,
  };
};

export { getUserDeviceData, deviceId };
