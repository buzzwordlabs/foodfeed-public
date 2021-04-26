import { StyleSheet, View } from "react-native";
import { forwardRef, useEffect, useState } from "react";

import React from "react";
import Text from "../Primitives/Text";
import { prettyTimeMS } from "../../utils";
import { tintColor } from "../../constants";

interface Props {
  destructor: (ref: any) => any;
}

interface State {
  duration: number;
}

const initialState: State = {
  duration: 0,
};

const StreamTimer = forwardRef((props: Props, timerRef: any) => {
  const [state, setState] = useState(initialState);
  const { destructor } = props;
  useEffect(() => {
    startTimer();
    return () => destructor(timerRef);
  }, []);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef);
    timerRef.current = setInterval(() => {
      setState(({ duration }) => ({ duration: duration + 1000 }));
    }, 1000);
  };

  return (
    <View style={{ flexDirection: "row" }}>
      <View
        style={{
          backgroundColor: tintColor,
          paddingVertical: 2,
          paddingHorizontal: 8,
          borderTopLeftRadius: 3,
          borderBottomLeftRadius: 3,
        }}
      >
        <Text s="lg" w="bold">
          LIVE
        </Text>
      </View>
      <View
        style={{
          paddingVertical: 2,
          paddingHorizontal: 8,
          borderTopRightRadius: 3,
          borderBottomRightRadius: 3,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "white",
          borderLeftWidth: 0,
        }}
      >
        <Text s="lg" w="bold">
          {prettyTimeMS(state.duration / 1000).textFormat}
        </Text>
      </View>
    </View>
  );
});

export default StreamTimer;
