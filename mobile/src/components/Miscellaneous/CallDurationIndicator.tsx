import React from "react";
import { Text, LoadingIndicator } from "../Primitives";
import { TextStyle } from "react-native";
import { prettyTimeMS } from "../../utils";

interface Props {
  duration: number;
  textStyle: TextStyle;
}

const CallDurationIndicator = (props: Props) => {
  const { duration, textStyle } = props;
  if (duration > 0) {
    return (
      <Text style={textStyle} s="lg" w="bold">
        {prettyTimeMS(duration / 1000).textFormat}
      </Text>
    );
  }
  return <LoadingIndicator />;
};

export default CallDurationIndicator;
