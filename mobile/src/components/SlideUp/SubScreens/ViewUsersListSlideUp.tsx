import React, { forwardRef } from "react";
import { Modalize } from "react-native-modalize";
import SlideUp, { SlideUpProps } from "../SlideUp";
import { window, defaultHorizontalInset } from "../../../constants";
import {
  FlatList,
  Platform,
  View,
  RefreshControlProps,
  RefreshControl,
} from "react-native";
import {
  ProfileItem,
  ProfileItemUserInfo,
  ProfileItemProps,
  OnPressProfileItem,
} from "../../Lists/ProfileItem";
import { Text, Icon, LoadingIndicator } from "../../Primitives";
import { useOrientation } from "../../../hooks";
import { PaginationState } from "../../../utils";
import SlideUpHeader from "../SlideUpHeader";
import { XCloseButton } from "../../Miscellaneous";

interface Props
  extends Partial<
    Pick<
      PaginationState,
      "paginationLoading" | "refreshing" | "initLoading" | "reachedEnd"
    >
  > {
  users: ProfileItemUserInfo[];
  onPressProfileItem: OnPressProfileItem;
  onCancel: () => any | Promise<any>;

  onClose?: () => any | Promise<any>;
  paginate?: () => Promise<any>;
  listEmptyText?: string;
  ListEmptyComponent?: () => JSX.Element;
  ListFooterComponent?: () => JSX.Element;
  ListHeaderComponent?: () => JSX.Element;
  RefreshControlComponent?: () => React.ReactElement<RefreshControlProps>;
  slideUpProps?: SlideUpProps;
  profileItemActiveOpacity?: number;
}

const ViewUsersListSlideUp = forwardRef(
  (props: Props, ref: React.Ref<Modalize>) => {
    const [orientationState] = useOrientation();

    const ListEmptyComponent = () =>
      !props.initLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ marginTop: 40 }} s="lg" w="bold" a="center">
            {props.listEmptyText || "Sorry, no people yet!"}
          </Text>
        </View>
      ) : (
        <></>
      );

    const ListFooterComponent = () => {
      if (props.paginationLoading) {
        return <LoadingIndicator style={{ marginVertical: 40 }} />;
      }
      if (props.reachedEnd) {
        return (
          <Text a="center" w="bold" style={{ marginVertical: 20 }}>
            You've reached the 🔚
          </Text>
        );
      }
    };

    const ListHeaderComponent = () => (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-end",
          marginBottom: 10,
        }}
      >
        <View style={{ marginRight: 5 }}>
          <Text s="lg" w="bold">
            {props.users.length}
          </Text>
        </View>
        <Icon
          library="ionicons"
          name={`${Platform.OS === "ios" ? "ios" : "md"}-people`}
          size={26}
        />
        <XCloseButton
          onPress={props.onCancel}
          touchableOpacityStyle={{ paddingRight: 0 }}
        />
      </View>
    );

    return (
      <SlideUp
        ref={ref}
        adjustToContentHeight={false}
        withHandle={false}
        onClose={props.onClose}
        modalStyle={{ flex: 1 }}
        innerContainerStyle={{
          paddingHorizontal: 0,
          paddingBottom: 40,
          flex: 1,
        }}
        scrollViewProps={{ contentContainerStyle: { height: "100%" } }}
        modalHeight={
          orientationState.orientationIsLandscape ? 100 : window.height * 0.8
        }
        panGestureEnabled={false}
        {...props.slideUpProps}
      >
        <FlatList
          style={{ flex: 1, paddingHorizontal: defaultHorizontalInset }}
          data={props.users}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          keyExtractor={(item: any, index: number) => index.toString()}
          refreshControl={
            props.RefreshControlComponent ? (
              props.RefreshControlComponent()
            ) : (
              <></>
            )
          }
          ListEmptyComponent={
            props.ListEmptyComponent
              ? props.ListEmptyComponent()
              : ListEmptyComponent()
          }
          ListHeaderComponent={
            props.ListHeaderComponent
              ? props.ListHeaderComponent()
              : ListHeaderComponent()
          }
          onEndReachedThreshold={0.4}
          ListFooterComponent={ListFooterComponent()}
          onEndReached={props.paginate || (() => {})}
          renderItem={({ item, index }) => (
            <ProfileItem
              {...item}
              activeOpacity={props.profileItemActiveOpacity || undefined}
              onPress={props.onPressProfileItem}
            />
          )}
        />
      </SlideUp>
    );
  }
);

export default ViewUsersListSlideUp;
