import {
  APN_KEY,
  APN_KEY_ID,
  APPLE_BUNDLE_ID_STRING,
  APPLE_DEV_TEAM_ID,
  FIREBASE_SERVER_KEY,
  IS_PRODUCTION
} from '../../config';
import * as db from '../../zapatos/src';
import * as s from '../../zapatos/schema';
import { pgPool } from '../../utils';

import PushNotifications from 'node-pushnotifications';
import { isPresent } from '../ts-coerce';

// missing type in types but located in docs
interface ExtendedPushOptions extends PushNotifications.Data {
  pushType?: string;
}

const removeInvalidTokens = async (failedNotifications: string[]) => {
  if (failedNotifications.length > 0) {
    await db.sql<s.users_devices.SQL>`
  UPDATE ${'users_devices'}
  SET ${'notificationToken'} = NULL
  WHERE ${'notificationToken'} = ANY(${db.param(failedNotifications)})`.run(
      pgPool
    );
  }
};

export type NotificationTokens = {
  appleNotificationTokens: string[];
  androidNotificationTokens: string[];
};

export const pushNotification = async (
  { appleNotificationTokens, androidNotificationTokens }: NotificationTokens,
  data: PushNotifications.Data
) => {
  const failedNotificationsResult: string[] = [];
  if (androidNotificationTokens && androidNotificationTokens.length > 0) {
    const settings = {
      gcm: {
        id: FIREBASE_SERVER_KEY
      }
    };
    const push = new PushNotifications(settings);
    const pushedNotification = await push.send(androidNotificationTokens, data);
    const failedNotifications = pushedNotification
      .map((notif) =>
        notif.failure ? notif.message[0].originalRegId : undefined
      )
      .filter(isPresent);
    if (failedNotifications.length > 0) {
      failedNotificationsResult.push(...failedNotifications);
    }
  }
  if (appleNotificationTokens && appleNotificationTokens.length > 0) {
    const settings = {
      apn: {
        token: {
          key: APN_KEY,
          keyId: APN_KEY_ID,
          teamId: APPLE_DEV_TEAM_ID
        },
        production: IS_PRODUCTION
      }
    };
    const push = new PushNotifications(settings);
    const applePushData: ExtendedPushOptions = {
      ...data,
      topic: APPLE_BUNDLE_ID_STRING,
      pushType: 'alert'
    };
    const pushedNotification = await push.send(
      appleNotificationTokens,
      applePushData
    );

    const failedNotifications = pushedNotification
      .map((notif) => (notif.failure ? notif.message[0].regId : undefined))
      .filter(isPresent);
    if (failedNotifications.length > 0) {
      failedNotificationsResult.push(...failedNotifications);
    }
  }
  return removeInvalidTokens(failedNotificationsResult);
};
