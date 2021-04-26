import { Linking } from "react-native";

const websiteBaseURL = "https://foodfeed.live";

const TOSUrl = `${websiteBaseURL}/terms-of-service`;

const privacyPolicyUrl = `${websiteBaseURL}/privacy-policy`;

const redirectTOS = () => {
  Linking.openURL(`${websiteBaseURL}/terms-of-service`);
};

const redirectPrivacyPolicy = () => {
  Linking.openURL(`${websiteBaseURL}/privacy-policy`);
};

const redirectSettings = () => {
  Linking.openSettings();
};

export {
  redirectPrivacyPolicy,
  redirectTOS,
  redirectSettings,
  TOSUrl,
  privacyPolicyUrl,
};
