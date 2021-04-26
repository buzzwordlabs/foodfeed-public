import React from "react";

interface Props {
  children: React.ReactNode | React.ReactNode[];
  loading?: boolean;
  error?: React.ReactNode;
}

const PresentationManager = (props: Props) => {
  const { children } = props;
  return <>{children}</>;
};

export default PresentationManager;
