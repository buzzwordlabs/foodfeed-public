import { Button, ParentView, Text, PermissionsSlideUp } from "../../components";
import React, { useContext, useState } from "react";

import { CallContext } from "../../contexts";
import {
  ConversationsStackNavProps,
  CreateStackNavProps,
} from "../../navigation";
import { Image } from "react-native";
import { foodCall } from "../../assets";
import { window } from "../../constants";
import { useSlideUp, usePermissionStatus } from "../../hooks";
import { PermissionType } from "../../utils";

type Props = CreateStackNavProps<"CallsRoot">;

const CallsRoot = (props: Props) => {
  const callContext = useContext(CallContext);
  const permissions: PermissionType[] = ["camera", "microphone"];
  const [permissionsState, refreshPermissionStatus] = usePermissionStatus(
    permissions
  );
  const [permissionsRef, onOpenPermissions, onClosePermissions] = useSlideUp();

  const pushToRoom = () => {
    const successfulSetup = callContext.setupRoom();
    if (successfulSetup) {
      props.navigation.push("WaitingRoom");
    }
  };

  return (
    <ParentView safeBottomInset style={{ flex: 1 }}>
      <Text s="xl" w="bold">
        Eat with someone new from anywhere around the world!
      </Text>
      <Image
        source={foodCall}
        style={{
          width: 350,
          height: 350,
          maxHeight: window.height * 0.4,
          maxWidth: window.width,
          resizeMode: "contain",
          alignSelf: "center",
          marginTop: 40,
        }}
      />
      <Button
        style={{ marginTop: 40 }}
        title="Enter the Waiting Room"
        onPress={
          permissionsState.allStatuses !== "granted"
            ? onOpenPermissions
            : pushToRoom
        }
      />
      <PermissionsSlideUp
        ref={permissionsRef}
        permissionsState={permissionsState}
        onPressX={onClosePermissions}
        onAllPermissionsGrantedCallback={() => {
          onClosePermissions();
        }}
        refreshPermissionStatus={refreshPermissionStatus}
      />
    </ParentView>
  );
};

export default CallsRoot;
