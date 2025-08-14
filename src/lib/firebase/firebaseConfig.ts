import { initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  MessagePayload,
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

const app = initializeApp(firebaseConfig);

// Initialize messaging
export const messaging = getMessaging(app);

getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY })
  .then(currentToken => {
    if (currentToken) {
      console.log('currentToken', currentToken);
    } else {
      console.log('No registration token');
    }
  })
  .catch(err => {
    console.log('Error getting token', err);
  });

// Handle foreground messages
export const onForegroundMessage = (
  callback: (payload: MessagePayload) => void
) => {
  return onMessage(messaging, callback);
};

export default app;
