import Orientation, {
  ListenerCallback,
  OrientationType,
} from "react-native-orientation-locker";
import { useEffect, useState } from "react";

type State = {
  /**
   * The orientation the device thinks it's at.
   */
  orientation: OrientationType;
  /**
   * The orientation the device is actually at.
   */
  deviceOrientation: OrientationType;
  /**
   * The device thinks it's in landscape mode.
   */
  orientationIsLandscape: boolean;
  /**
   * The device is actually in landscape mode.
   */
  deviceIsLandscape: boolean;
};

/**
 * Gives access to orientation state and listeners. Automatically unlocks all orientations.
 * @argument onOrientationChangeCallback
 * A callback that runs when orientation changes.
 * @returns
 * State object: {
 *  orientation: enum(["PORTRAIT", "PORTRAIT-UPSIDEDOWN", "LANDSCAPE-LEFT", "LANDSCAPE-RIGHT", "FACE-UP", "FACE-DOWN", "UNKNOWN"]),
 *  isLandscape: boolean
 * }
 */

type UseOrientationArgs = {
  onOrientationChangeCallback?: ListenerCallback;
  onDeviceOrientationChangeCallBack?: ListenerCallback;
};

const useOrientation = ({
  onOrientationChangeCallback,
  onDeviceOrientationChangeCallBack,
}: UseOrientationArgs = {}): [State] => {
  const [state, setState] = useState<State>({
    orientation: "UNKNOWN",
    deviceOrientation: "UNKNOWN",
    orientationIsLandscape: false,
    deviceIsLandscape: false,
  });

  useEffect(() => {
    Orientation.unlockAllOrientations();
    Orientation.addOrientationListener((newOrientation) => {
      setState((prevState) => ({
        ...prevState,
        orientation: newOrientation,
        orientationIsLandscape: ["LANDSCAPE-LEFT", "LANDSCAPE-RIGHT"].includes(
          newOrientation
        ),
      }));
      if (onOrientationChangeCallback)
        onOrientationChangeCallback(newOrientation);
    });

    Orientation.addDeviceOrientationListener((newOrientation) => {
      setState((prevState) => ({
        ...prevState,
        deviceOrientation: newOrientation,
        deviceIsLandscape: ["LANDSCAPE-LEFT", "LANDSCAPE-RIGHT"].includes(
          newOrientation
        ),
      }));
      if (onDeviceOrientationChangeCallBack)
        onDeviceOrientationChangeCallBack(newOrientation);
    });

    return () => Orientation.removeAllListeners();
  }, []);

  return [state];
};

export default useOrientation;
