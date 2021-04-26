import {
  Avatar,
  Icon,
  ParentView,
  Text,
  WebViewSlideUp,
} from "../../components";
import {
  Platform,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import React, { useContext } from "react";
import { TOSUrl, privacyPolicyUrl } from "../../utils";

import { AccountStackNavProps } from "../../navigation";
import { FontType } from "../../components/types";
import { GlobalContext, ThemeContext } from "../../contexts";
import { IconProps } from "../../components/Primitives/Icon";
import { appName } from "../../constants";
import { getVersion } from "react-native-device-info";
import { useLogout, useSlideUp } from "../../hooks";

type Props = AccountStackNavProps<"Settings">;

const Settings = (props: Props) => {
  const global = useContext(GlobalContext);
  const [logout] = useLogout();
  const [TOSWebViewRef, openTOSWebView, closeTOSWebView] = useSlideUp();
  const [
    privacyPolicyWebView,
    openPrivacyPolicyWebView,
    closePrivacyPolicyWebView,
  ] = useSlideUp();

  return (
    <ParentView>
      <View style={{ marginBottom: 20 }}>
        <View
          style={{
            justifyContent: "space-between",
            flexDirection: "row",
            flex: 1,
          }}
        >
          <View>
            <Text s="header" w="bold" numberOfLines={2} ellipsizeMode="tail">
              {global.state.firstName
                ? `${global.state.firstName} ${global.state.lastName}`
                : appName}
            </Text>
            <Text w="semiBold">Welcome back!</Text>
          </View>
          <TouchableOpacity
            onPress={() => props.navigation.push("AccountSettings")}
          >
            <Avatar
              avatar={global.state.avatar}
              style={{ width: 40, height: 40 }}
            />
          </TouchableOpacity>
        </View>
        <Section
          label="Account"
          AccountButtons={[
            {
              title: "Appearance",
              onPress: () => props.navigation.push("AppearanceSettings"),
              iconProps: {
                name: "paint-bucket",
                library: "foundation",
                size: 24,
              },
            },
            {
              title: "Block List",
              onPress: () => props.navigation.push("BlockList"),
              iconProps: {
                name: "block",
                library: "entypo",
                size: 20,
              },
            },
          ]}
        />
        <Section
          label="Support"
          AccountButtons={[
            {
              title: "FAQs",
              onPress: () => props.navigation.push("FAQ"),
              iconProps: {
                name: "questioncircleo",
                library: "antdesign",
                size: 20,
              },
            },
            {
              title: "Get help",
              onPress: () => props.navigation.push("Help"),
              iconProps: {
                name: "new-message",
                library: "entypo",
                size: 18,
              },
            },
            {
              title: "Give us feedback",
              onPress: () => props.navigation.push("Feedback"),
              iconProps: {
                name: `${Platform.OS === "ios" ? "ios" : "md"}-mail`,
                library: "ionicons",
                size: 20,
              },
            },
          ]}
        />
        <Section
          label="About"
          AccountButtons={[
            {
              onPress: openTOSWebView,
              title: "Terms of use",
              iconProps: {
                name: `${Platform.OS === "ios" ? "ios" : "md"}-book`,
                library: "ionicons",
                size: 20,
              },
            },
            {
              onPress: openPrivacyPolicyWebView,
              title: " Privacy policy",
              iconProps: {
                name: `${Platform.OS === "ios" ? "ios" : "md"}-document`,
                library: "ionicons",
                size: 20,
              },
            },
          ]}
        />
        <Section
          AccountButtons={[
            {
              onPress: () => logout({ noPrompt: false }),
              title: "Sign Out",
              textType: "highlight",
              iconProps: {
                name: "logout",
                library: "materialComIcons",
                size: 18,
              },
            },
          ]}
        />
        <Section>
          <Text a="center" s="xs">
            Buzzword Labs, Inc
          </Text>
          <Text a="center" s="xs">
            Version {getVersion()}
          </Text>
        </Section>
      </View>
      <WebViewSlideUp
        ref={TOSWebViewRef}
        onPressClose={closeTOSWebView}
        uri={TOSUrl}
      />
      <WebViewSlideUp
        ref={privacyPolicyWebView}
        onPressClose={closePrivacyPolicyWebView}
        uri={privacyPolicyUrl}
      />
    </ParentView>
  );
};

interface SectionProps {
  children?: JSX.Element | JSX.Element[];
  label?: string;
  style?: ViewStyle;
  AccountButtons?: {
    onPress: () => void;
    title: string;
    textType?: FontType;
    subtitle?: string;
    iconProps?: IconProps;
    subtitleStyle?: TextStyle;
  }[];
}

const Section = ({ label, AccountButtons, children, style }: SectionProps) => {
  const { borderColor, defaultIconColor } = useContext(ThemeContext);
  return (
    <View style={[{ marginTop: 30 }, style]}>
      {label && (
        <View
          style={{
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: borderColor,
            paddingBottom: 10,
          }}
        >
          <Text w="bold" t="highlight">
            {label}
          </Text>
        </View>
      )}
      {AccountButtons &&
        AccountButtons.map(
          (
            { onPress, title, textType, subtitle, iconProps, subtitleStyle },
            key
          ) => (
            <TouchableOpacity
              key={key}
              style={{
                alignItems: "center",
                flexDirection: "row",
                marginVertical: 15,
                marginHorizontal: 10,
              }}
              onPress={onPress}
            >
              <View
                style={{ alignSelf: subtitle ? "flex-start" : "flex-start" }}
              >
                {iconProps && <Icon {...iconProps} color={defaultIconColor} />}
              </View>
              <View style={{ marginLeft: 10, alignSelf: "center" }}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  t={textType}
                  s="lg"
                  w="semiBold"
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text t="muted" s="sm" w="semiBold" style={subtitleStyle}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )
        )}
      {children}
    </View>
  );
};

export default Settings;
