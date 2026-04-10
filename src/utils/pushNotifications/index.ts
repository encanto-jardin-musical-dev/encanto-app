import { getToken, messaging } from '@/lib/firebase/firebaseConfig';
import type { NotificationPermission } from '@/types/notifications.types';
import { storeDeviceToken } from './storeDeviceToken';

const DEVICE_TOKEN_CACHE_KEY = 'encanto_fcm_token';
const DEVICE_TOKEN_TIMESTAMP_KEY = 'encanto_fcm_token_ts';
const TOKEN_FRESHNESS_MS = 24 * 60 * 60 * 1000; // 24 hours

// Returns the cached token if it is unchanged and was stored < 24h ago.
function isCachedTokenFresh(token: string): boolean {
  try {
    const cached = localStorage.getItem(DEVICE_TOKEN_CACHE_KEY);
    const ts = localStorage.getItem(DEVICE_TOKEN_TIMESTAMP_KEY);
    if (cached !== token || !ts) return false;
    return Date.now() - parseInt(ts, 10) < TOKEN_FRESHNESS_MS;
  } catch {
    return false;
  }
}

function cacheToken(token: string): void {
  try {
    localStorage.setItem(DEVICE_TOKEN_CACHE_KEY, token);
    localStorage.setItem(DEVICE_TOKEN_TIMESTAMP_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable — non-fatal
  }
}

// Returns the last cached FCM token (used by removeDeviceToken on logout).
export function getCachedFcmToken(): string | null {
  try {
    return localStorage.getItem(DEVICE_TOKEN_CACHE_KEY);
  } catch {
    return null;
  }
}

// Clears the cached FCM token from localStorage (call after removeDeviceToken).
export function clearCachedFcmToken(): void {
  try {
    localStorage.removeItem(DEVICE_TOKEN_CACHE_KEY);
    localStorage.removeItem(DEVICE_TOKEN_TIMESTAMP_KEY);
  } catch {
    // non-fatal
  }
}

// Check if push notifications are supported
export const isPushNotificationSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
};

// Register the Firebase Messaging service worker explicitly.
// Uses /firebase-messaging-sw.js with the FCM-specific scope so FCM's
// PushManager subscription binds to the right worker. The Serwist PWA worker
// (/sw.js) lives at scope / and handles caching separately.
export const registerFirebaseServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isPushNotificationSupported()) {
      console.warn('[pushNotifications] Service worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        {
          scope: '/firebase-cloud-messaging-push-scope',
          updateViaCache: 'none',
        }
      );
      await registration.update();
      console.log('[pushNotifications] Firebase messaging SW registered');
      return registration;
    } catch (error) {
      console.error('[pushNotifications] Error registering Firebase messaging SW:', error);
      return null;
    }
  };

// Request notification permission, then get the FCM token.
// Permission is requested BEFORE getToken so a valid token is returned on
// the first opt-in (calling getToken while permission === 'default' fails).
export const getNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (!isPushNotificationSupported()) {
      console.log('[pushNotifications] Push notifications not supported');
      return 'denied';
    }

    if (!messaging) {
      console.error('[pushNotifications] Firebase messaging not initialized');
      return 'denied';
    }

    // Step 1: request permission first
    const permission = await Notification.requestPermission();
    console.log('[pushNotifications] Notification permission:', permission);

    if (permission !== 'granted') {
      return permission;
    }

    // Step 2: register the Firebase SW
    const registration = await registerFirebaseServiceWorker();
    if (!registration) {
      console.error('[pushNotifications] Failed to register Firebase messaging SW');
      return 'denied';
    }

    // Step 3: get FCM token and store it
    try {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        // Skip upsert if token is unchanged and last_seen_at is fresh (< 24h)
        if (!isCachedTokenFresh(token)) {
          await storeDeviceToken(token);
          cacheToken(token);
          console.log('[pushNotifications] FCM token stored successfully');
        } else {
          console.log('[pushNotifications] FCM token unchanged and fresh — skipping upsert');
        }
      } else {
        console.warn('[pushNotifications] No FCM token received');
      }
    } catch (error) {
      console.error('[pushNotifications] Error getting FCM token:', error);
      // Permission was granted but token retrieval failed — still return granted
      // so the UI shows the correct state. Token will be retried on next load.
    }

    return permission;
  };

// Check current permission state and request if not yet decided.
export const checkAndRequestPermission =
  async (): Promise<NotificationPermission> => {
    if (!isPushNotificationSupported()) {
      return 'denied';
    }

    const current = Notification.permission as NotificationPermission;
    if (current === 'granted') {
      // Already granted — ensure the token is stored (handles page reloads,
      // token refreshes, etc.)
      return getNotificationPermission();
    }

    if (current === 'denied') {
      return 'denied';
    }

    // 'default' — prompt the user
    return getNotificationPermission();
  };
