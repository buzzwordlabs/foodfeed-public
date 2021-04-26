import React from "react";
import { FlatListProps, ViewToken } from "react-native";

export type CarouselRef = React.Ref<React.Component<FlatListProps<any>>>;

export interface Info {
  viewableItems: ViewToken[];
  changed: ViewToken[];
}

export type ViewabilityConfigRef = React.Ref<ViewabilityConfig>;
export type ViewableItemsChangedRef = React.Ref<(info: Info) => void>;

export interface ViewabilityConfigViewAreaCoveragePercentThreshold
  extends ViewabilityConfigBase {
  viewAreaCoveragePercentThreshold: number;
}
export interface ViewabilityConfigItemVisiblePercentThreshold
  extends ViewabilityConfigBase {
  itemVisiblePercentThreshold: number;
}

export interface ViewabilityConfigBase {
  minimumViewTime: number;
  waitForInteraction: boolean;
}

export type ViewabilityConfig =
  | ViewabilityConfigViewAreaCoveragePercentThreshold
  | ViewabilityConfigItemVisiblePercentThreshold;

export const viewabilityConfig: ViewabilityConfig = {
  minimumViewTime: 1,
  itemVisiblePercentThreshold: 10,
  waitForInteraction: false,
};
