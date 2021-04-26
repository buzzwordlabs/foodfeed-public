import { PlaceholderLine as DefaultPlaceholderLine } from "rn-placeholder";
import React from "react";
import { ViewProps } from "react-native";

export interface ILine extends ViewProps {
  height?: number;
  color?: string;
  width?: number;
  noMargin?: boolean;
  style?: ViewProps["style"];
}

const PlaceholderLine = (props: ILine) => {
  return <DefaultPlaceholderLine color="black" {...props} />;
};

export default PlaceholderLine;
