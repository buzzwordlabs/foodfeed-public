import ReactNativeHapticFeedback from "react-native-haptic-feedback";

export const tinyVibration = () => {
  const vibrationOptions = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: true,
  };

  ReactNativeHapticFeedback.trigger("impactLight", vibrationOptions);
};
