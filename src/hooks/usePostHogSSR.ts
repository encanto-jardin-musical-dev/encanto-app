import { useEffect } from 'react';
import { posthogClient } from '@/lib/posthog/client';

export function usePostHogPageView(pathname: string) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      posthogClient.capture('$pageview', {
        $current_url: pathname,
      });
    }
  }, [pathname]);
}

export function usePostHogIdentify(userId?: string, properties?: Record<string, unknown>) {
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      posthogClient.identify(userId, properties);
    }
  }, [userId, properties]);
}