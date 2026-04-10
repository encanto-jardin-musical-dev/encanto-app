import { getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, Messaging, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.warn('[firebaseConfig] Missing environment variables:', missingEnvVars);
}

if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  console.warn('[firebaseConfig] Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY — push notifications will not work');
}

// Initialize Firebase and messaging synchronously in browser-only context.
// FCM background messages are handled by the dedicated service worker
// (/firebase-messaging-sw.js) registered with scope /firebase-cloud-messaging-push-scope.
// Do NOT put FCM logic in /sw.js (Serwist).
let messaging: Messaging | undefined;

if (typeof window !== 'undefined') {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    messaging = getMessaging(app);
    console.log('[firebaseConfig] Firebase messaging initialized');
  } catch (error) {
    console.error('[firebaseConfig] Error initializing Firebase:', error);
  }
}

export { getToken, messaging, onMessage };
