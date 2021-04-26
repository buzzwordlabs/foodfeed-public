import { MessageOptions, showMessage } from "react-native-flash-message";

import { tintColor } from "./../constants/colors";

export const singleLineString = (
  strings: TemplateStringsArray,
  ...values: string[]
) => {
  // Interweave the strings with the
  // substitution vars first.
  let output = "";
  for (let i = 0; i < values.length; i++) {
    output += strings[i] + values[i];
  }
  output += strings[values.length];

  // Split on newlines.
  const lines = output.split(/(?:\r\n|\n|\r)/);

  // Rip out the leading whitespace.
  return lines
    .map((line) => {
      return line.replace(/^\s+/gm, "");
    })
    .join(" ")
    .trim();
};

export const showBanner = (props: MessageOptions) => {
  const { type, message, description, onPress, duration } = props;
  let messageOptions: MessageOptions = {
    message: singleLineString`${message}`,
    description: description ? singleLineString`${description!}` : undefined,
    onPress,
    type,
    animated: true,
    autoHide: true,
    floating: true,
    duration: duration ?? 7000,
    textStyle: { fontFamily: "Muli-SemiBold", fontSize: 16, color: "white" },
    titleStyle: {
      fontFamily: "Muli-SemiBold",
      fontSize: 18,
      paddingTop: 6,
      color: "white",
    },
  };

  if (!type || type === "default" || type === "none") {
    messageOptions = {
      ...messageOptions,
      backgroundColor: tintColor,
    };
  }

  showMessage(messageOptions);
};
