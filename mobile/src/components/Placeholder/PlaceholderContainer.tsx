import { Fade, Placeholder } from "rn-placeholder";

import React from "react";
import { ViewProps } from "react-native";

export interface IPlaceholder extends ViewProps {
  Animation?: React.ComponentType;
  Left?: React.ComponentType<ViewProps>;
  Right?: React.ComponentType<ViewProps>;
  children: React.ReactNode[] | React.ReactNode;
}

const PlaceholderContainer = (props: IPlaceholder) => {
  return (
    <Placeholder Animation={Fade} {...props}>
      {props.children}
    </Placeholder>
  );
};

export default PlaceholderContainer;
