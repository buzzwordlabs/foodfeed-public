import Orientation from "react-native-orientation-locker";
import { useEffect } from "react";

/**
 * Lets screen go into landscape using `Orientation.unlockAllOrientations()`.
 * At cleanup, ensures that orientation is locked back to portrait.
 */
const useLandscapeOrientation = () => {
  useEffect(() => {
    Orientation.unlockAllOrientations();
    return () => Orientation.lockToPortrait();
  }, []);
};

export default useLandscapeOrientation;
