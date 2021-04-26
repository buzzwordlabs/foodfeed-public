import {
  PERMISSIONS,
  PermissionStatus,
  check,
  checkNotifications,
  requestNotifications,
  request as requestPermissionRaw,
  NotificationOption,
} from "react-native-permissions";

import { Platform } from "react-native";

export interface AllPermissionsStatus {
  notifications: PermissionStatus;
  camera: PermissionStatus;
  microphone: PermissionStatus;
  storage: PermissionStatus;
  allStatuses: "denied" | "granted";
}

export enum PermissionTypeEnum {
  notifications = "notifications",
  camera = "camera",
  microphone = "microphone",
  storage = "storage",
}

export type PermissionType = keyof typeof PermissionTypeEnum;

export const ALL_PERMISSIONS_OPTIONS: PermissionType[] = Object.values(
  PermissionTypeEnum
);

const MICROPHONE =
  Platform.OS === "ios"
    ? PERMISSIONS.IOS.MICROPHONE
    : PERMISSIONS.ANDROID.RECORD_AUDIO;

const CAMERA =
  Platform.OS === "ios" ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

const PHOTO_LIBRARY = PERMISSIONS.IOS.PHOTO_LIBRARY;

const requestMicrophonePermission = async () =>
  requestPermissionRaw(MICROPHONE);

const requestCameraPermission = async () => requestPermissionRaw(CAMERA);

const requestNotificationPermission = async () => {
  const notificationOptions: NotificationOption[] = ["alert", "badge"];
  const { status } = await requestNotifications(notificationOptions);
  return status;
};

const requestWriteExternalStoragePermission = async () =>
  requestPermissionRaw(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);

const requestReadExternalStoragePermission = async () =>
  requestPermissionRaw(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);

const requestStoragePermission = async () => {
  if (Platform.OS === "ios") return requestPermissionRaw(PHOTO_LIBRARY);
  const read = await requestReadExternalStoragePermission();
  const write = await requestWriteExternalStoragePermission();
  if (read === "granted" && write === "granted") return "granted";
  return "denied";
};

export const checkMultiplePermissions = async (
  permissions: PermissionType[]
) => {
  let allPermissionStatuses: AllPermissionsStatus = {} as AllPermissionsStatus;
  for (let i = 0; i < permissions.length; i++) {
    const permissionType = permissions[i];
    allPermissionStatuses[permissionType] = await checkPermission(
      permissionType
    );
  }
  allPermissionStatuses["allStatuses"] = allPermissionsGranted(
    Object.values(allPermissionStatuses)
  )
    ? "granted"
    : "denied";
  return allPermissionStatuses;
};

export const requestMultiplePermissions = async (
  permissions: PermissionType[]
) => {
  let allPermissionStatuses: AllPermissionsStatus = {} as AllPermissionsStatus;
  for (let i = 0; i < permissions.length; i++) {
    const permissionType = permissions[i];
    allPermissionStatuses[permissionType] = await requestPermission(
      permissionType
    );
  }
  allPermissionStatuses["allStatuses"] = allPermissionsGranted(
    Object.values(allPermissionStatuses)
  )
    ? "granted"
    : "denied";
  return allPermissionStatuses;
};

export const allPermissionsGranted = (
  permissionStatuses: PermissionStatus[]
) => {
  return permissionStatuses.every((status) => status === "granted");
};

export const checkPermission = async (permission: PermissionType) => {
  switch (permission) {
    case "camera":
      return check(CAMERA);
    case "microphone":
      return check(MICROPHONE);
    case "notifications":
      return Platform.OS === "ios"
        ? (await checkNotifications()).status
        : "granted";
    case "storage":
      if (Platform.OS === "ios") {
        return check(PHOTO_LIBRARY);
      } else {
        const read = await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
        const write = await check(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
        if (read === "granted" && write === "granted") return "granted";
        else return "denied";
      }
  }
};

export const requestPermission = async (permission: PermissionType) => {
  switch (permission) {
    case "camera":
      return requestCameraPermission();
    case "microphone":
      return requestMicrophonePermission();
    case "notifications":
      return Platform.OS === "ios"
        ? requestNotificationPermission()
        : "granted";
    case "storage":
      return requestStoragePermission();
  }
};

export const requestAllPermissions = async () => {
  return requestMultiplePermissions(ALL_PERMISSIONS_OPTIONS);
};

export const checkAllPermissions = async () => {
  return checkMultiplePermissions(ALL_PERMISSIONS_OPTIONS);
};
