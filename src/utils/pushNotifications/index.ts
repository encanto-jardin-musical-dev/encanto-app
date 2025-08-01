import type { NotificationPermission } from '@/types/notifications.types';

// check if push notifications are supported
export const isPushNotificationSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// get notification permission
export const getNotificationPermission = (): NotificationPermission => {
  if (!isPushNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

// request notification permission
export const requestNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (!isPushNotificationSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

// register service worker
export const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isPushNotificationSupported()) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  };

// subscribe to push notifications
export const subscribeToPushNotifications =
  async (): Promise<PushSubscription | null> => {
    if (!isPushNotificationSupported()) {
      console.warn('Push notifications not supported');
      return null;
    }

    const permission = getNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const registration = await registerServiceWorker();
      if (!registration) {
        return null;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      console.log('Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  };

// unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('Push subscription removed');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

// check and request permission
export const checkAndRequestPermission =
  async (): Promise<NotificationPermission> => {
    const currentPermission = getNotificationPermission();

    if (currentPermission === 'default') {
      return await requestNotificationPermission();
    }

    return currentPermission;
  };
