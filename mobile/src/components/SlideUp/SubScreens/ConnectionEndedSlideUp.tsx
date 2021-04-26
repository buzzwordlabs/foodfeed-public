import React, { forwardRef } from "react";
import { View } from "react-native";

import Button from "../../Primitives/Button";
import { Modalize } from "react-native-modalize";
import SlideUp from "../SlideUp";
import Text from "../../Primitives/Text";

interface Props {
  hostUsername: string;
  type: "live-stream" | "call";
  onClose: () => any;
  ref: React.Ref<Modalize>;
}

const ConnectionEndedSlideUp: React.FC<Props> = forwardRef(
  (props: Props, ref: React.Ref<Modalize>) => {
    const { hostUsername, type, onClose } = props;

    return (
      <SlideUp ref={ref} justifyContentCenter adjustToContentHeight={false}>
        <View>
          <Text s="subHeader" w="bold">
            {hostUsername} Ended this{" "}
            {type === "live-stream" ? "Live Stream" : "Call"}{" "}
          </Text>
          <Button title="Okay" onPress={onClose} />
        </View>
      </SlideUp>
    );
  }
);

export default ConnectionEndedSlideUp;
