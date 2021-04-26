import { Client, Configuration, IMetadata } from "bugsnag-react-native";

import ENV from "../../env";

const config = new Configuration(ENV.BUGSNAG_API_KEY);

config.releaseStage = process.env.NODE_ENV;
config.notifyReleaseStages = ["production"];

const bugsnag = new Client(config);

export enum MiscellaneousBreadcrumbEnum {
  "call_unknown_error" = "call_unknown_error",
  "unauthorized" = "unauthorized",
  "network_switch" = "network_switch",
}

const bugsnagBreadcrumb = (
  name: keyof typeof MiscellaneousBreadcrumbEnum,
  metadata?: IMetadata | string
) => bugsnag.leaveBreadcrumb(name, metadata);

export { bugsnag, bugsnagBreadcrumb };
