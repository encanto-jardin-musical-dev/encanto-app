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

    // E2E only: lets Playwright force-enable flag-gated routes (e.g. the
    // admin_options_* flags behind FeatureFlagRoleGate) without depending on
    // a real PostHog project/network. Never set outside test runs.
    const e2eFlags = process.env.NEXT_PUBLIC_E2E_FEATURE_FLAGS;
    if (e2eFlags) {
      posthog.featureFlags.overrideFeatureFlags(
        e2eFlags.split(',').map(flag => flag.trim()).filter(Boolean)
      );
    }
  }
  return posthog;
}

export { posthog as posthogClient };