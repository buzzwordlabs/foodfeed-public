import * as s from '../../zapatos/schema';

export const extractNotificationTokensFromUsersDevices = (
  userDevices: Pick<
    s.users_devices.Selectable,
    'notificationToken' | 'platform'
  >[]
) => {
  const notificationTokens = {
    appleNotificationTokens: [] as string[],
    androidNotificationTokens: [] as string[]
  };
  userDevices.map((user) => {
    if (user.notificationToken) {
      if (user.platform === 'android') {
        notificationTokens.androidNotificationTokens.push(
          user.notificationToken
        );
      } else if (user.platform === 'ios') {
        notificationTokens.appleNotificationTokens.push(user.notificationToken);
      }
    }
  });
  if (
    notificationTokens.androidNotificationTokens.length > 0 ||
    notificationTokens.appleNotificationTokens.length > 0
  ) {
    return notificationTokens;
  } else {
    return undefined;
  }
};
