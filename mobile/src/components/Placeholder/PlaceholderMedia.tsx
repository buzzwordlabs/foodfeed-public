import { PlaceholderMedia as DefaultPlaceholderMedia } from "rn-placeholder";
import React from "react";
import { ViewProps } from "react-native";

export interface IMedia extends ViewProps {
  size?: number;
  isRound?: boolean;
  color?: string;
  style?: ViewProps["style"];
}

const PlaceholderMedia = (props: IMedia) => {
  return (
    <DefaultPlaceholderMedia
      color="black"
      style={{ backgroundColor: "black" }}
      {...props}
    />
  );
};

export default PlaceholderMedia;
