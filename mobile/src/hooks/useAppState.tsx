import { useState, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";

interface State {
  currentAppState: AppStateStatus;
  prevAppState: AppStateStatus;
}

const initialState: State = {
  currentAppState: "active",
  prevAppState: "active",
};

interface Props {
  onAppStateChangeCallback?: (
    appState?: AppStateStatus
  ) => void | Promise<void>;
}

const useAppState = (callbacks?: Props): [AppStateStatus, AppStateStatus] => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    AppState.addEventListener("change", handleAppStateChange);
    return () => {
      AppState.removeEventListener("change", handleAppStateChange);
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    setState((prev) => ({
      currentAppState: nextAppState,
      prevAppState: prev.currentAppState,
    }));
    callbacks?.onAppStateChangeCallback && callbacks.onAppStateChangeCallback();
  };

  return [state.currentAppState, state.prevAppState];
};

export default useAppState;
