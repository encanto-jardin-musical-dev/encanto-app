#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Firebase configuration template
const firebaseSwTemplate = `// Firebase Messaging Service Worker
// This service worker handles Firebase Cloud Messaging background messages
// Generated at build time - DO NOT EDIT MANUALLY

// Firebase configuration
const firebaseConfig = {
  apiKey: '{{FIREBASE_API_KEY}}',
  authDomain: '{{FIREBASE_AUTH_DOMAIN}}',
  projectId: '{{FIREBASE_PROJECT_ID}}',
  storageBucket: '{{FIREBASE_STORAGE_BUCKET}}',
  messagingSenderId: '{{FIREBASE_MESSAGING_SENDER_ID}}',
  appId: '{{FIREBASE_APP_ID}}',
};

// Initialize Firebase app
let messaging;

try {
  // Import Firebase scripts
  importScripts(
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js'
  );
  importScripts(
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js'
  );

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  messaging = firebase.messaging();

  console.log('[firebase-messaging-sw.js] Firebase initialized successfully');
} catch (error) {
  console.error(
    '[firebase-messaging-sw.js] Error initializing Firebase:',
    error
  );
}

// Handle background messages
if (messaging) {
  messaging.onBackgroundMessage(payload => {
    console.log(
      '[firebase-messaging-sw.js] Received background message:',
      payload
    );

    // Customize notification based on payload
    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new message',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'message-notification',
      data: payload.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open App',
        },
        {
          action: 'close',
          title: 'Close',
        },
      ],
      requireInteraction: true,
      silent: false,
    };

    // Show notification
    return self.registration.showNotification(
      notificationTitle,
      notificationOptions
    );
  });
}

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Check if there's already a window/tab open with the target URL
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }

          // If no window/tab is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
});

console.log(
  '[firebase-messaging-sw.js] Firebase messaging service worker loaded successfully'
);
`;

// Environment variables mapping
const envMapping = {
  '{{FIREBASE_API_KEY}}': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  '{{FIREBASE_AUTH_DOMAIN}}': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  '{{FIREBASE_PROJECT_ID}}': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  '{{FIREBASE_STORAGE_BUCKET}}':
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  '{{FIREBASE_MESSAGING_SENDER_ID}}':
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  '{{FIREBASE_APP_ID}}': process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Generate the service worker content
function generateFirebaseSw() {
  let content = firebaseSwTemplate;

  // Replace placeholders with environment variables
  Object.entries(envMapping).forEach(([placeholder, value]) => {
    if (!value) {
      console.warn(
        `Warning: Environment variable for ${placeholder} is not set`
      );
      return;
    }
    content = content.replace(new RegExp(placeholder, 'g'), value);
  });

  return content;
}

// Write the generated service worker to the public directory
function writeFirebaseSw() {
  const publicDir = path.join(dirname(__dirname), 'public');
  const outputPath = path.join(publicDir, 'firebase-messaging-sw.js');

  try {
    const content = generateFirebaseSw();
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log('✅ Firebase messaging service worker generated successfully');
    console.log(`📁 Output: ${outputPath}`);
  } catch (error) {
    console.error(
      '❌ Error generating Firebase messaging service worker:',
      error
    );
    process.exit(1);
  }
}

// Run the script
writeFirebaseSw();
