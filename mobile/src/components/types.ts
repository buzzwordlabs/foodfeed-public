import React from "react";

export type IconLibaries =
  | "feather"
  | "fontAwesome5"
  | "fontAwesome"
  | "ionicons"
  | "materialIcons"
  | "entypo"
  | "antdesign"
  | "materialComIcons"
  | "simpleLine"
  | "foundation";

export type FontEllipsizeMode = "tail";
export type FontType = "error" | "success" | "muted" | "highlight" | "none";
export type FontSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "xxl"
  | "subHeader"
  | "header";
export type FontWeight =
  | "extraLight"
  | "light"
  | "regular"
  | "medium"
  | "semiBold"
  | "bold"
  | "extraBold";
export type FontAlignment = "left" | "center" | "right";
export type FontFloat = "right";
export type Children = React.ReactChildren;
