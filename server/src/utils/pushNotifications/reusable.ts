import { NotificationTokens, pushNotification } from './base';
import { ReactionsStringIndexed } from '../constants';

export type NotificationArgsBase = { notificationTokens: NotificationTokens };

export type CustomNotificationTypes =
  | 'deeplink_new_livestream'
  | 'deeplink_new_follower'
  | 'deeplink_new_post_interaction'
  | 'deeplink_new_message_information';

export type NewLiveStreamNotificationArgs = {
  customData: {
    deviceId: string;
    username: string;
  };
} & NotificationArgsBase;

export type NewFollowerNotificationArgs = {
  customData: {
    username: string;
  };
} & NotificationArgsBase;

export type NewPostInteractionNotificationArgs = {
  customData: {
    postId: string;
    username: string;
    interaction: 'reacted' | 'commented';
  };
} & NotificationArgsBase;

export type NewMessageInformationNotificationArgs = {
  customData: NotificationDataReaction | NotificationDataNewMessage;
} & NotificationArgsBase;

export type NotificationDataReaction = {
  conversationId: string;
  username: string;
  interaction: 'reaction';
  message: string;
  reaction: string;
};

export type NotificationDataNewMessage = {
  conversationId: string;
  username: string;
  interaction: 'new';
  message: string;
};

const baseNotificationData = { title: 'FoodFeed' };

export const newLiveStreamNotification = async ({
  customData,
  notificationTokens
}: NewLiveStreamNotificationArgs) => {
  const { deviceId, username } = customData;
  const type: CustomNotificationTypes = 'deeplink_new_livestream';
  const notificationData = {
    ...baseNotificationData,
    body: `${
      username ?? 'Your favorite streamer'
    } is live! Check out their stream in the app.`,
    custom: { deviceId, type }
  };
  return pushNotification(notificationTokens, notificationData);
};

export const newFollowerNotification = async ({
  customData,
  notificationTokens
}: NewFollowerNotificationArgs) => {
  const { username } = customData;
  const type: CustomNotificationTypes = 'deeplink_new_follower';
  const notificationData = {
    ...baseNotificationData,
    body: username
      ? `${username} just followed you!`
      : 'You have a new follower!',
    custom: { username, type }
  };

  return pushNotification(notificationTokens, notificationData);
};

export const newPostInteractionNotification = async ({
  customData,
  notificationTokens
}: NewPostInteractionNotificationArgs) => {
  const { postId, username, interaction } = customData;
  const type: CustomNotificationTypes = 'deeplink_new_post_interaction';
  const notificationData = {
    ...baseNotificationData,
    body: username
      ? `${username} ${
          interaction === 'reacted'
            ? 'reacted to'
            : interaction === 'commented'
            ? 'commented on'
            : 'reacted to'
        } your post!`
      : 'You have a new reaction or comment on your post!',
    custom: { postId, type }
  };
  return pushNotification(notificationTokens, notificationData);
};

export const newMessageInformationNotification = async ({
  customData,
  notificationTokens
}: NewMessageInformationNotificationArgs) => {
  const {
    conversationId,
    username,
    interaction,
    message,
    reaction
  }: any = customData;
  const type: CustomNotificationTypes = 'deeplink_new_message_information';
  const notificationData = {
    title: username,
    body:
      interaction === 'new'
        ? message.substring(0, 300)
        : interaction === 'reaction'
        ? username +
          ' reacted ' +
          ReactionsStringIndexed[
            reaction as keyof typeof ReactionsStringIndexed
          ] +
          ' to: ' +
          message.substring(0, 20)
        : 'New Message',
    custom: { conversationId, type }
  };
  return pushNotification(notificationTokens, notificationData);
};
