import { initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  Messaging,
  onMessage,
} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate environment variables
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
  console.warn(
    '[firebaseConfig] Missing environment variables:',
    missingEnvVars
  );
}

if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_PUBLIC_KEY) {
  console.warn(
    '[firebaseConfig] Missing NEXT_PUBLIC_FIREBASE_VAPID_PUBLIC_KEY - push notifications may not work'
  );
}

let messaging: Messaging | undefined;
let messagingInitialized = false;

// Initialize Firebase and messaging only in browser environment
if (typeof window !== 'undefined' && 'navigator' in window) {
  try {
    console.log('[firebaseConfig] Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    console.log('[firebaseConfig] Firebase app initialized');

    // Initialize messaging directly
    try {
      messaging = getMessaging(app);
      messagingInitialized = true;
      console.log(
        '[firebaseConfig] Firebase messaging initialized successfully'
      );
    } catch (error) {
      console.error('[firebaseConfig] Error initializing messaging:', error);
    }
  } catch (error) {
    console.error('[firebaseConfig] Error initializing Firebase:', error);
  }
}

// Function to wait for messaging to be ready
export const waitForMessaging = async (): Promise<Messaging | null> => {
  if (messagingInitialized && messaging) {
    return messaging;
  }

  // Wait for messaging to be initialized
  let attempts = 0;
  const maxAttempts = 30; // Wait up to 30 seconds

  while (!messagingInitialized && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
    console.log(
      `[firebaseConfig] Waiting for messaging... attempt ${attempts}/${maxAttempts}`
    );
  }

  if (messagingInitialized && messaging) {
    return messaging;
  }

  console.error(
    '[firebaseConfig] Messaging failed to initialize after waiting'
  );
  return null;
};

export { getToken, messaging, onMessage };
