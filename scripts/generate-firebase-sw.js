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

// Read the installed firebase version from package.json so the CDN import
// stays in sync with the version used in the app (task 6.2).
function getFirebaseVersion() {
  try {
    const pkgPath = path.join(dirname(__dirname), 'node_modules', 'firebase', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version;
  } catch {
    console.warn('Warning: could not read firebase version from node_modules; falling back to 12.10.0');
    return '12.10.0';
  }
}

const firebaseVersion = getFirebaseVersion();

// Firebase configuration template
// NOTE: This file handles ONLY Firebase Cloud Messaging background push notifications.
// PWA caching and navigation preload live in /sw.js (Serwist).
// Do NOT add FCM logic to src/app/sw.ts.
const firebaseSwTemplate = `// Firebase Messaging Service Worker
// This service worker handles Firebase Cloud Messaging background messages.
// Generated at build time by scripts/generate-firebase-sw.js — DO NOT EDIT MANUALLY.
//
// FCM uses scope /firebase-cloud-messaging-push-scope, registered explicitly in
// src/utils/pushNotifications/index.ts. The Serwist PWA worker (/sw.js) lives at
// scope / and handles caching — the two workers do not overlap.

// Take control immediately when a new version is installed so click routing
// and notification handling update without requiring a tab close/reopen.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

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
  importScripts(
    'https://www.gstatic.com/firebasejs/{{FIREBASE_VERSION}}/firebase-app-compat.js'
  );
  importScripts(
    'https://www.gstatic.com/firebasejs/{{FIREBASE_VERSION}}/firebase-messaging-compat.js'
  );

  firebase.initializeApp(firebaseConfig);
  messaging = firebase.messaging();

  console.log('[firebase-messaging-sw.js] Firebase initialized (v{{FIREBASE_VERSION}})');
} catch (error) {
  console.error('[firebase-messaging-sw.js] Error initializing Firebase:', error);
}

// Handle background messages
if (messaging) {
  messaging.onBackgroundMessage(payload => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);

    const data = payload.data || {};
    const notificationTitle =
      data.title || payload.notification?.title || 'Nuevo mensaje';
    const notificationBody =
      data.body || payload.notification?.body || 'Tienes un nuevo mensaje';

    // Per-conversation tag: collapses multiple messages from the same conversation
    // while allowing messages from different conversations to stack.
    const tag = data.tag || 'conversation:unknown';

    const notificationOptions = {
      body: notificationBody,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag,
      data,
      requireInteraction: true,
      silent: false,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification clicks — route to the correct conversation
self.addEventListener('notificationclick', event => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  event.notification.close();

  if (event.action === 'close') return;

  const data = event.notification.data || {};
  // data.route is set by the Edge Function (e.g. /messages/<senderId> or /messages)
  const targetRoute = data.route || '/messages';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Focus an existing tab that is already on the target route
        for (const client of clientList) {
          const url = new URL(client.url);
          if (url.pathname === targetRoute && 'focus' in client) {
            return client.focus();
          }
        }
        // No matching tab — focus any open tab and navigate, or open a new window
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus().then(focusedClient => {
              // navigate() is available on controlled clients; fall back to openWindow
              if (focusedClient && 'navigate' in focusedClient) {
                return focusedClient.navigate(targetRoute);
              }
              return clients.openWindow(targetRoute);
            });
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetRoute);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
});

console.log('[firebase-messaging-sw.js] Firebase messaging service worker loaded (v{{FIREBASE_VERSION}})');
`;

// Environment variables mapping
const envMapping = {
  '{{FIREBASE_API_KEY}}': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  '{{FIREBASE_AUTH_DOMAIN}}': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  '{{FIREBASE_PROJECT_ID}}': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  '{{FIREBASE_STORAGE_BUCKET}}': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  '{{FIREBASE_MESSAGING_SENDER_ID}}': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  '{{FIREBASE_APP_ID}}': process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  '{{FIREBASE_VERSION}}': firebaseVersion,
};

// Generate the service worker content
function generateFirebaseSw() {
  let content = firebaseSwTemplate;

  Object.entries(envMapping).forEach(([placeholder, value]) => {
    if (!value) {
      console.warn(`Warning: environment variable for ${placeholder} is not set`);
      return;
    }
    content = content.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
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
    console.log(`🔥 Firebase SDK version: ${firebaseVersion}`);
  } catch (error) {
    console.error('❌ Error generating Firebase messaging service worker:', error);
    process.exit(1);
  }
}

// Run the script
writeFirebaseSw();
