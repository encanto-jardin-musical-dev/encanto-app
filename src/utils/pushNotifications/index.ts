import type { NotificationPermission } from '@/types/notifications.types';

// check if push notifications are supported
export const isPushNotificationSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// get notification permission
export const getNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (!isPushNotificationSupported()) {
      return 'denied';
    }
    return await Notification.requestPermission();
  };

// check and request permission
export const checkAndRequestPermission =
  async (): Promise<NotificationPermission> => {
    const currentPermission = await getNotificationPermission();

    if (currentPermission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch {
        return 'denied';
      }
    }

    return currentPermission;
  };
