import { IconLibaries } from "../../types";
import { Platform } from "react-native";
import React from "react";
import SlideUpButtonBase from "./SlideUpButtonBase";
import { errorColor } from "../../../constants";

type ButtonTypes =
  | "profile"
  | "report"
  | "watch"
  | "block"
  | "unblock"
  | "close"
  | "take_photo"
  | "upload_photo"
  | "follow"
  | "unfollow"
  | "share"
  | "end_call"
  | "people"
  | "messages"
  | "copy"
  | "open_in_browser"
  | "edit"
  | "delete"
  | "like"
  | "unlike"
  | "reaction"
  | "help_feedback"
  | "mark_read"
  | "settings"
  | "info";

type Props = {
  type: ButtonTypes;
  onPress: (...args: any[]) => any | Promise<any>;
  title?: string;
  loading?: boolean;
};

type SlideUpButtonBaseIconProps = {
  name?: string;
  size?: number;
  library?: IconLibaries;
  title: string;
  color?: string;
  textColor?: string;
};

const resolveIconProps = (
  type: ButtonTypes,
  title?: string
): SlideUpButtonBaseIconProps => {
  switch (type) {
    case "profile":
      return {
        title: title || "Profile",
        name: "account-circle",
        library: "materialComIcons",
        size: 24,
      };
    case "watch":
      return {
        title: title || "Watch",
        library: "ionicons",
        name: `${Platform.OS === "ios" ? "ios" : "md"}-play`,
        size: 30,
      };
    case "block":
      return {
        title: title || "Block",
        library: "entypo",
        name: "block",
        size: 22,
      };
    case "unblock":
      return {
        title: title || "Unblock",
        library: "ionicons",
        name: "md-unlock",
        size: 28,
      };
    case "report":
      return {
        title: title || "Report",
        library: "ionicons",
        name: `${Platform.OS === "ios" ? "ios" : "md"}-flag`,
        size: 28,
      };
    case "close":
      return {
        title: title || "Cancel",
        library: "antdesign",
        name: "close",
        size: 28,
      };
    case "take_photo":
      return {
        title: title || "Take photo",
        library: "materialIcons",
        name: "camera-alt",
        size: 32,
      };
    case "follow":
      return {
        title: title || "Follow",
        library: "materialComIcons",
        name: "plus",
        size: 32,
      };
    case "share":
      return {
        title: title || "Share",
        library: "ionicons",
        name: `${Platform.OS === "ios" ? "ios" : "md"}-share`,
        size: 30,
      };
    case "upload_photo":
      return {
        title: title || "Choose from camera roll",
        library: "materialIcons",
        name: "photo-library",
        size: 32,
      };
    case "end_call":
      return {
        title: title || "Hang up",
        library: "feather",
        name: "phone-off",
        size: 22,
      };
    case "people":
      return {
        title: title || "People",
        library: "ionicons",
        name: `${Platform.OS === "ios" ? "ios" : "md"}-people`,
        size: 30,
      };
    case "messages":
      return {
        title: title || "Messages",
        library: "ionicons",
        name: `${Platform.OS === "ios" ? "ios" : "md"}-chatboxes`,
        size: 30,
      };
    case "copy":
      return {
        title: title || "Copy",
        library: "ionicons",
        name: `${Platform.OS === "ios" ? "ios" : "md"}-copy`,
        size: 26,
      };
    case "open_in_browser":
      return {
        title: title || "Open in browser",
        library: "materialComIcons",
        name: `${Platform.OS === "ios" ? "compass" : "google-chrome"}`,
        size: 30,
      };
    case "unfollow":
      return {
        title: title || "Unfollow",
        library: "materialComIcons",
        name: "minus",
        size: 32,
      };
    case "delete":
      return {
        title: title || "Delete",
        library: "materialIcons",
        name: "delete-forever",
        size: 30,
      };
    case "edit":
      return {
        title: title || "Edit",
        library: "antdesign",
        name: "edit",
        size: 26,
      };
    case "like":
      return {
        title: title || "Like",
        size: 24,
        library: "antdesign",
        name: "heart",
      };
    case "unlike":
      return {
        title: title || "Unlike",
        size: 24,
        library: "antdesign",
        name: "heart",
        color: errorColor,
      };
    case "reaction":
      return {
        title: title || "Add reaction",
        size: 24,
        library: "entypo",
        name: "emoji-happy",
      };
    case "help_feedback":
      return {
        title: title || "Help or feedback",
        size: 24,
        library: "materialComIcons",
        name: "comment-question",
      };
    case "settings":
      return {
        title: title || "Settings",
        size: 32,
        library: "ionicons",
        name: `${Platform.OS === "ios" ? "ios" : "md"}-settings`,
      };
    case "mark_read":
      return {
        title: title || "Mark as read",
        size: 22,
        library: "antdesign",
        name: "checksquare",
      };
    case "info":
      return {
        title: title || "Info",
        size: 22,
        library: "antdesign",
        name: "infocirlceo",
      };
  }
};

const SlideUpButton = ({ type, ...props }: Props) => (
  <SlideUpButtonBase {...resolveIconProps(type)} {...props} />
);

export default SlideUpButton;
