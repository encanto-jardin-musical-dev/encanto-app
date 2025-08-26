import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Register Firebase messaging service worker
self.addEventListener('install', () => {
  console.log('[sw.ts] Service worker installing...');
});

self.addEventListener('activate', event => {
  console.log('[sw.ts] Service worker activating...');
  // Ensure the service worker takes control immediately
  event.waitUntil(self.clients.claim());
});

console.log('[sw.ts] Main service worker loaded successfully');
