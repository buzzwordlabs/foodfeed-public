export const tintColor = "#F35627";
export const fadedTintColor = `${tintColor}33`;
export const tabIconSelected = "#F35627";
export const errorColor = "#EF5350";
export const successColor = "#28A745";
export const dividerColor = "#A4A4A4";
export const gradientColors = ["#F35627", "#FA950D"];
export const fadeGradientColors = [
  "rgba(0,0,0,0)",
  "rgba(0,0,0,0.4)",
  "rgba(0,0,0,0.7)",
];
const focusedActionButtonBackgroundColor = `${tintColor}dd`;
const focusedActionButtonTextColor = "#fff";

const shared = {
  tintColor,
  tabIconSelected,
  errorColor,
  successColor,
  dividerColor,
  gradientColors,
  focusedActionButtonBackgroundColor,
  focusedActionButtonTextColor,
};

export type ThemeOptions = "dark" | "light";

export interface Theme {
  themeName: ThemeOptions;
  tintColor: string;
  tabIconSelected: string;
  tabIconUnselected: string;
  errorColor: string;
  successColor: string;
  dividerColor: string;
  gradientColors: string[];
  tabBarColor: string;
  borderColor: string;
  buttonTextColor: string;
  textColor: string;
  mutedText: string;
  backgroundColor: string;
  liftedBackgroundColor: string;
  liveChatBackgroundColor: string;
  chatTextInputBackgroundColor: string;
  chatTextInputPlaceholderColor: string;
  mutedButtonBackgroundColor: string;
  shadowBorderColor: string;
  focusedActionButtonTextColor: string;
  focusedActionButtonBackgroundColor: string;
  defaultIconColor: string;
  tabViewTabBackgroundColor: string;
  modalBackgroundColor: string;
}

export interface Themes {
  dark: Theme;
  light: Theme;
}

export const themes: Themes = {
  dark: {
    ...shared,
    themeName: "dark",
    tabBarColor: "#2A2A2A",
    tabIconUnselected: "#888888",
    borderColor: "#6E6E6E",
    buttonTextColor: "#F2F2F2",
    textColor: "#E6E6E6",
    mutedText: "#A7A7A7",
    shadowBorderColor: "#585858",
    backgroundColor: "#131313",
    // backgroundColor: "#000000",
    // liftedBackgroundColor: "#2A2A2A",
    // liftedBackgroundColor: "#151718",
    liftedBackgroundColor: "#202020",
    liveChatBackgroundColor: "#151515",
    // liveChatBackgroundColor: "#0c0d0e",
    mutedButtonBackgroundColor: "#393939",
    chatTextInputBackgroundColor: "#1e1e1e",
    chatTextInputPlaceholderColor: "lightgray",
    defaultIconColor: "gray",
    tabViewTabBackgroundColor: "#232323",
    modalBackgroundColor: "#232323",
  },
  light: {
    ...shared,
    themeName: "light",
    borderColor: "darkgray",
    tabBarColor: "#FAFAFA",
    tabIconUnselected: "#171717",
    buttonTextColor: "#2E2E2E",
    backgroundColor: "#FAFAFA",
    textColor: "#2E2E2E",
    mutedText: "gray",
    liftedBackgroundColor: "#FAFAFA",
    shadowBorderColor: "#F7F7F7",
    liveChatBackgroundColor: "#F2F2F2",
    mutedButtonBackgroundColor: "white",
    chatTextInputBackgroundColor: "#F2F2F2",
    chatTextInputPlaceholderColor: "gray",
    defaultIconColor: "#171717",
    tabViewTabBackgroundColor: "#FAFAFA",
    modalBackgroundColor: "#FAFAFA",
  },
};

export const resolveTheme = (theme: ThemeOptions) => {
  switch (theme) {
    case "dark":
      return themes.dark;
    case "light":
      return themes.light;
    default:
      return themes.dark;
  }
};
