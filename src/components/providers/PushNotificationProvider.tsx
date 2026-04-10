'use client';

import { messaging, onMessage } from '@/lib/firebase/firebaseConfig';
import { addToast, Button } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

// Listens for foreground FCM messages and dispatches HeroUI toasts when the
// user is active in the app but not already viewing the relevant conversation.
//
// Design decisions:
// - Mounted in providers.tsx so the handler exists from first render on any
//   authenticated page, not only when a message component mounts.
// - Reads pathname lazily inside the callback (via a ref) to avoid a stale
//   closure capturing the initial route (D4, R6 in the design doc).
export function PushNotificationProvider() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const t = useTranslations('PushNotifications');

  // Keep the ref current so the onMessage callback always reads the latest route
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, payload => {
      const data = payload.data ?? {};
      const route = data.route ?? '/messages';
      const currentPath = pathnameRef.current;

      // Suppress toast if the user is already on the matching conversation route
      if (currentPath === route) return;

      const title = payload.notification?.title ?? t('defaultTitle');
      const body = payload.notification?.body ?? t('defaultBody');

      addToast({
        title,
        description: body,
        color: 'primary',
        timeout: 5000,
        endContent: (
          <Button
            size="sm"
            variant="flat"
            color="primary"
            onPress={() => router.push(route)}
          >
            {t('openAction')}
          </Button>
        ),
      });
    });

    return () => unsubscribe();
  }, [router, t]);

  return null;
}
