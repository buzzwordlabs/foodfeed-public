declare module "react-native-admob" {
  import { ViewStyle } from "react-native";

  // Common
  export type AdMobError = { framesToPop: number } & Error;
  export type NonErrorEventTypes =
    | "adLoaded"
    | "adFailedToLoad"
    | "adOpened"
    | "adClosed"
    | "adLeftApplication";
  export type ErrorEventTypes = "adFailedToLoad";
  export type NonErrorHandler = (handler: () => void) => void;
  export type ErrorHandler = (error: AdMobError) => void;

  // Imperative Ads
  class ImperativeAds {
    static simulatorId: "SIMULATOR";
    static setAdUnitID(adUnitID: string): void;
    static setTestDevices(testDevices: string[]): void;
    static requestAd(): Promise<void>;
    static showAd(): Promise<void>;
    static isReady(callback: (readyToBeShown: boolean) => any): Promise<void>;

    static addEventListener(
      eventType: NonErrorEventTypes,
      handler: () => void
    ): void;
    static addEventListener(
      eventType: ErrorEventTypes,
      handler: (error: AdMobError) => void
    ): void;
    static removeEventListener(
      eventType: NonErrorEventTypes | ErrorEventTypes,
      handler: () => void
    ): void;
    static removeAllListeners(): void;
  }

  /**
   * Full-page ad format that appears at natural breaks and transitions, such as level completion.
   *
   * Further Explained:
   * Interstitial ads are full-screen ads that cover the interface of an app until closed by the user.
   * They're typically displayed at natural transition points in the flow of an app, such as between
   * activities or during the pause between levels in a game. When an app shows an interstitial ad,
   * the user has the choice to either tap on the ad and continue to its destination or close it and
   * return to the app.
   * @see https://developers.google.com/admob/ios/interstitial
   * @see https://developers.google.com/admob/android/interstitial
   */
  export class AdMobInterstitial extends ImperativeAds {}

  export type RewardedNonErrorEventTypes =
    | "rewarded"
    | "videoStarted"
    | ("videoCompleted" & NonErrorEventTypes);

  /**
   * Ad format that rewards users for watching ads. Great for monetizing free-to-play users.
   *
   * Further Explained:
   * Rewarded ads are ads that users have the option of interacting with in exchange for in-app
   * rewards. This guide shows you how to integrate rewarded ads from AdMob into an Android app.
   * @see https://developers.google.com/admob/ios/rewarded-ads
   * @see https://developers.google.com/admob/android/rewarded-ads
   */
  export class AdMobRewarded extends ImperativeAds {
    static addEventListener(
      eventType: RewardedNonErrorEventTypes,
      handler: () => void
    ): void;
    static addEventListener(
      eventType: ErrorEventTypes,
      handler: (error: AdMobError) => void
    ): void;
  }

  // Declarative Ads
  export interface DFPEvents {
    /**
     * DFP library events
     */
    onAdLoaded?: NonErrorHandler;
    onAdFailedToLoad?: ErrorHandler;
    onAdOpened?: NonErrorHandler;
    onAdClosed?: NonErrorHandler;
    onAdLeftApplication?: NonErrorHandler;
  }

  // Banner
  export type Dimensions = { width: number; height: number };
  export type AdSizeOptions =
    | "banner"
    | "largeBanner"
    | "mediumRectangle"
    | "fullBanner"
    | "leaderboard"
    | "smartBannerPortrait"
    | "smartBannerLandscape";

  export interface BannerProps extends DFPEvents {
    /**
     * DFP iOS library banner size constants
     * (https://developers.google.com/admob/ios/banner)
     *
     * banner (320x50, Standard Banner for Phones and Tablets)
     *
     * largeBanner (320x100, Large Banner for Phones and Tablets)
     *
     * mediumRectangle (300x250, IAB Medium Rectangle for Phones and Tablets)
     *
     * fullBanner (468x60, IAB Full-Size Banner for Tablets)
     *
     * leaderboard (728x90, IAB Leaderboard for Tablets)
     *
     * smartBannerPortrait (Screen width x 32|50|90, Smart Banner for Phones and Tablets)
     *
     * smartBannerLandscape (Screen width x 32|50|90, Smart Banner for Phones and Tablets)
     *
     * Default: banner
     */
    adSize: AdSizeOptions;

    /**
     * DFP ad unit ID
     */
    adUnitID: string;

    /**
     * Array of test devices. Use PublisherBanner.simulatorId for the simulator
     */
    testDevices: string[];

    style?: ViewStyle;

    /**
     * Called when the size of the banner changes. The function is called with an object containing the width and the height.
     */
    onSizeChange?: (dimensions: Dimensions) => void;
  }

  export interface BannerState {
    style: ViewStyle;
  }

  class Banner<P> extends React.Component<P & BannerProps, BannerState> {
    static simulatorId: "SIMULATOR";
    static loadBanner(): void;
    static handleSizeChange(): void;
    static handleAppEvent(): void;
    static handleAdFailedToLoad(): void;
  }

  /**
   * Rectangular ads that occupy a portion of an app's layout. Can be refreshed automatically
   * after a period of time. With this component, ads are delivered by the Admob network.
   *
   * Further Explained:
   * Banner ads occupy a spot within an app's layout, either at the top or bottom of the
   * device screen. They stay on screen while users are interacting with the app, and can
   * refresh automatically after a certain period of time. If you're new to mobile
   * advertising, they're a great place to start.
   * @see https://developers.google.com/admob/ios/banner
   * @see https://developers.google.com/admob/android/banner
   */
  export class AdMobBanner<P extends BannerProps> extends Banner<P> {}

  // PublisherBanner
  export interface OnAppEventHandlerArgs {
    name: string;
    info: string;
  }

  export interface PublishedBannerProps extends BannerProps {
    /**
     * Optional array specifying all valid sizes that are appropriate for this slot.
     */
    validAdSizes?: string[];
  }

  /**
   * Similar to AdMobBanner except doesn't use Admob network to show ads. Uses two additional properties:
   * `onAppEvent` and `validAdSizes`.
   * Meant for custom use with a DFP server, if you need
   * to leverage your own network. In most cases, AdMobBanner makes sense. Explained briefly here:
   * @see https://stackoverflow.com/questions/56097190/difference-between-admobbanner-publisherbanner-in-react-native-admob-for-googl
   */
  export class PublisherBanner<P extends PublishedBannerProps> extends Banner<
    P
  > {
    static onAppEvent(eventInfo: OnAppEventHandlerArgs): void;
  }
}
