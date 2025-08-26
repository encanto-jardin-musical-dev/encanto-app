import { getToken, waitForMessaging } from '@/lib/firebase/firebaseConfig';
import type { NotificationPermission } from '@/types/notifications.types';
import { storeFCMToken } from './storeFCMToken';

// check if push notifications are supported
export const isPushNotificationSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
};

// register service worker for Firebase messaging
export const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isPushNotificationSupported()) {
      console.warn('[pushNotifications] Service worker not supported');
      return null;
    }

    try {
      console.log(
        '[pushNotifications] Starting service worker registration...'
      );

      // Check if service worker is already registered
      if (navigator.serviceWorker.controller) {
        console.log(
          '[pushNotifications] Service worker already controlling the page'
        );
        return navigator.serviceWorker.ready;
      }

      // Register the main service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      console.log(
        '[pushNotifications] Main service worker registered:',
        registration
      );

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('[pushNotifications] Service worker ready');

      // Wait a bit more for the service worker to fully initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      return registration;
    } catch (error) {
      console.error(
        '[pushNotifications] Error registering service worker:',
        error
      );
      return null;
    }
  };

// get notification permission
export const getNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (!isPushNotificationSupported()) {
      console.log('[pushNotifications] Push notifications not supported');
      return 'denied';
    }

    console.log('[pushNotifications] Starting permission request process...');

    // Register service worker first
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('[pushNotifications] Failed to register service worker');
      return 'denied';
    }

    // Wait for messaging to be available
    console.log(
      '[pushNotifications] Waiting for Firebase messaging to be ready...'
    );
    const messagingInstance = await waitForMessaging();

    if (!messagingInstance) {
      console.error(
        '[pushNotifications] Firebase messaging failed to initialize'
      );
      return 'denied';
    }

    try {
      console.log('[pushNotifications] Requesting FCM token...');

      const token = await getToken(messagingInstance, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        localStorage.setItem('fcmToken', token);
        await storeFCMToken(token);
        console.log('[pushNotifications] FCM token obtained successfully');
      } else {
        console.warn('[pushNotifications] No FCM token received');
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      console.log(
        '[pushNotifications] Notification permission result:',
        permission
      );

      return permission;
    } catch (error) {
      console.error('[pushNotifications] Error getting FCM token:', error);
      return 'denied';
    }
  };

// check and request permission
export const checkAndRequestPermission =
  async (): Promise<NotificationPermission> => {
    console.log('[pushNotifications] Checking and requesting permission...');

    try {
      const currentPermission = await getNotificationPermission();

      if (currentPermission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          console.log(
            '[pushNotifications] Final permission result:',
            permission
          );
          return permission;
        } catch (error) {
          console.error(
            '[pushNotifications] Error requesting permission:',
            error
          );
          return 'denied';
        }
      }

      return currentPermission;
    } catch (error) {
      console.error(
        '[pushNotifications] Error in checkAndRequestPermission:',
        error
      );
      return 'denied';
    }
  };
