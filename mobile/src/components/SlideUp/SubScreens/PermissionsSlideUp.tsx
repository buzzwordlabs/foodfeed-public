import { useEffect, forwardRef } from "react";
import { View, TouchableOpacity } from "react-native";
import SlideUp from "../SlideUp";
import { Text } from "../../Primitives";
import React from "react";
import { PermissionType, requestPermission } from "../../../utils";
import { XCloseButton } from "../../Miscellaneous";
import { window, statusBarHeight } from "../../../constants";
import { openSettings } from "react-native-permissions";
import {
  PermissionStatusState,
  RefreshPermissionStatusFn,
  OverwritePermissionStatus,
} from "../../../hooks/usePermissionStatus";
import { Modalize } from "react-native-modalize";

export type RefreshPermissionStatusCallback = (
  permissionsState: PermissionStatusState
) => void;

interface Props {
  permissionsState: PermissionStatusState;
  refreshPermissionStatus: RefreshPermissionStatusFn;
  onAllPermissionsGrantedCallback: () => void;
  onRefreshPermissionStatusCallback?: RefreshPermissionStatusCallback;
  onPressX: () => void;
  title?: string;
  ref: React.Ref<Modalize>;
}

const PermissionsSlideUp: React.FC<Props> = forwardRef(
  (props: Props, ref: any) => {
    const permissions = Object.keys(props.permissionsState).filter(
      (p) => p !== "allStatuses"
    ) as PermissionType[];

    useEffect(() => {
      refreshPermissionStatus();
    }, []);

    const refreshPermissionStatus = async () => {
      const permissionsState = await props.refreshPermissionStatus();
      props.onRefreshPermissionStatusCallback &&
        props.onRefreshPermissionStatusCallback(permissionsState);
    };

    useEffect(() => {
      const permissionsStatuses = permissions.map(
        (permission) => props.permissionsState[permission]
      );
      if (
        props.permissionsState.allStatuses !== "granted" &&
        anyNotOfPermissionStatus(permissionsStatuses, "undetermined")
      ) {
        return;
      } else if (anyNotOfPermissionStatus(permissionsStatuses, "granted")) {
        refreshPermissionStatus();
        return;
      } else if (props.permissionsState.allStatuses === "granted") {
        props.onAllPermissionsGrantedCallback();
        return;
      }
    }, [props.permissionsState]);

    const anyNotOfPermissionStatus = (
      permissionsStatuses: OverwritePermissionStatus[],
      status: OverwritePermissionStatus
    ) => {
      return permissionsStatuses.some((s) => s !== status);
    };

    const resolvePermissionItems = () => {
      return permissions.map((permissionType, index) => (
        <PermissionItem
          key={index}
          type={permissionType}
          granted={props.permissionsState[permissionType] === "granted"}
          requestPermissionFn={async () => {
            const permissionStatus = props.permissionsState[permissionType];
            if (permissionStatus === "granted") {
            } else if (permissionStatus === "denied") {
              await requestPermission(permissionType);
              refreshPermissionStatus();
            } else await openSettings();
          }}
        />
      ));
    };

    return (
      <SlideUp
        ref={ref}
        adjustToContentHeight={false}
        isMandatory
        withHandle={false}
        HeaderComponent={
          <View style={{ marginRight: 10 }}>
            <XCloseButton onPress={props.onPressX} />
          </View>
        }
        modalHeight={window.height - statusBarHeight}
        modalTopOffset={0}
        modalStyle={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      >
        <View style={{ marginTop: 50 }}>
          {props.title && (
            <View>
              <Text s="subHeader" w="bold" a="center">
                {props.title}
              </Text>
            </View>
          )}
          <View style={{ marginTop: 30 }}>{resolvePermissionItems()}</View>
        </View>
      </SlideUp>
    );
  }
);

interface PermissionItemProps {
  granted: boolean;
  type: PermissionType;
  requestPermissionFn: () => Promise<any>;
}

const PermissionItem = (props: PermissionItemProps) => {
  const capitalizeFirstLetter = (word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  const resolvePermissionToFriendly = (permission: PermissionType) => {
    switch (permission) {
      case "storage":
        return "Photo Library";
      default:
        return capitalizeFirstLetter(permission);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={props.granted ? 1 : 0.2}
      onPress={props.requestPermissionFn}
      style={{
        marginVertical: 15,
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      <Text t="highlight" w="bold" s="xl">
        Give {resolvePermissionToFriendly(props.type)} Permission{" "}
        {props.granted ? "👍" : "👎"}
      </Text>
    </TouchableOpacity>
  );
};

export default PermissionsSlideUp;
