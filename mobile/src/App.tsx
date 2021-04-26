import { ContextWrapper } from "./contexts";
import React from "react";

import AppNavigator from "./navigation/AppNavigator";
import FlashMessage from "react-native-flash-message";
import { Host } from "react-native-portalize";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "./components";
import Modals, { ModalStackParams } from "./components/Modals";
import codePush from "react-native-code-push";
import { amplitudeTrack, AMPLITUDE_LIFETIME_EVENTS } from "./utils";
import {
  ModalProvider,
  createModalStack,
  ModalStackConfig,
  ModalOptions,
} from "react-native-modalfy";
import { Easing } from "react-native";

const modalConfig: ModalStackConfig = { ...Modals };
const defaultOptions: ModalOptions = {
  backdropOpacity: 0.6,
  disableFlingGesture: true,
};

const stack = createModalStack<ModalStackParams>(modalConfig, defaultOptions);

export class Root extends React.Component {
  componentDidMount() {
    amplitudeTrack(AMPLITUDE_LIFETIME_EVENTS.open_app);
  }

  render() {
    return (
      <NavigationContainer>
        <ContextWrapper>
          <ModalProvider stack={stack}>
            <Host>
              <App />
            </Host>
          </ModalProvider>
        </ContextWrapper>
      </NavigationContainer>
    );
  }
}

const App = () => {
  return (
    <>
      <StatusBar />
      <AppNavigator />
      <FlashMessage position="top" />
    </>
  );
};

export default codePush(undefined)(Root);
