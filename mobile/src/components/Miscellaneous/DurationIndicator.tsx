import React, { useEffect, useRef, useState } from "react";
import Text, { TextProps } from "../Primitives/Text";

import { TextStyle } from "react-native";
import { prettyTimeMS } from "../../utils";

const DurationIndicator = ({
  style,
  textProps,
}: {
  style: TextStyle;
  textProps?: TextProps;
}) => {
  const [duration, setDuration] = useState(0);
  const durationRef: any = useRef(null);

  useEffect(() => {
    durationRef.current = setInterval(
      () => setDuration((duration) => duration + 1000),
      1000
    );
    return () => {
      clearInterval(durationRef.current);
    };
  }, []);

  return (
    <Text w="bold" style={style} {...textProps}>
      {prettyTimeMS(duration / 1000).textFormat}
    </Text>
  );
};

export default DurationIndicator;
