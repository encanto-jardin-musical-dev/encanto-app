import posthog from 'posthog-js';

export function initPostHogClient() {
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: '/d4t4-3nc4nt0/',
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'always',
      defaults: '2025-05-24',
      capture_pageview: false,
      capture_pageleave: true,
    });
  }
  return posthog;
}

export { posthog as posthogClient };