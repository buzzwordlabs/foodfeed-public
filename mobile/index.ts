import "react-native-gesture-handler";

import { AppRegistry, YellowBox } from "react-native";

import App from "./src/App";
import { name as appName } from "./app.json";

YellowBox.ignoreWarnings([
  "VirtualizedLists should never be nested inside plain ScrollViews with the same orientation - use another VirtualizedList-backed container instead.",
  "`-[RCTRootView cancelTouches]` is deprecated",
  "Warning: componentWillReceiveProps",
  "Warning: componentWillMount",
  "source.uri should not be an empty string",
  "No video",
  "Sending `onAnimatedValueUpdate` with no listeners registered",
  "RNFetchBlob multipart request builder has found a field without `data` or `name` property",
  "Warning: Functions are not valid as a React child",
  "-[RNCamera initializeAudioCaptureSessionInput]: Error Domain",
  'Warning: "SearchInput": `ref` is not a prop.',
  "Breadcrumb name exceeds 30 characters",
]);

AppRegistry.registerComponent(appName, () => App);
