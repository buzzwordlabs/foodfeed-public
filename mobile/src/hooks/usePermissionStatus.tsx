import { PermissionStatus } from "react-native-permissions";
import { useState, useEffect } from "react";
import { PermissionType, checkMultiplePermissions } from "../utils";

export type OverwritePermissionStatus = PermissionStatus | "undetermined";

export type PermissionStatusState = {
  [key in PermissionType | "allStatuses"]: OverwritePermissionStatus;
};

type PermissionStatusObj = {
  [key in PermissionType | "allStatuses"]: OverwritePermissionStatus;
};

export type RefreshPermissionStatusFn = () => Promise<PermissionStatusState>;

const usePermissionStatus = (
  permissions: PermissionType[]
): [PermissionStatusState, RefreshPermissionStatusFn] => {
  let initialPermissionsStatus: PermissionStatusObj = {} as PermissionStatusObj;
  permissions.forEach(
    (permission) => (initialPermissionsStatus[permission] = "undetermined")
  );
  const initialState: PermissionStatusState = {
    ...initialPermissionsStatus,
    allStatuses: "undetermined",
  };

  const [state, setState] = useState(initialState);

  useEffect(() => {
    (async () => {
      await refreshPermissionStatus();
    })();
  }, []);

  const refreshPermissionStatus = async () => {
    const permissionStatuses = await checkMultiplePermissions(permissions);
    setState(permissionStatuses);
    return permissionStatuses;
  };

  return [state, refreshPermissionStatus];
};

export default usePermissionStatus;
