import React from "react";
import Text from "../Primitives/Text";
import { TouchableOpacity } from "react-native";
import { LoadingIndicator } from "../Primitives";

interface Props {
  onPress: () => any;
  title?: string;
  loading?: boolean;
}

const HeaderTextButton = (props: Props) => {
  const { onPress, title, loading } = props;

  return (
    <TouchableOpacity onPress={onPress}>
      {loading ? (
        <LoadingIndicator />
      ) : (
        <Text allowFontScaling={false} t="highlight" w="bold" s="lg">
          {title || "Submit"}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default HeaderTextButton;
