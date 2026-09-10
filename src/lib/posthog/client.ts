import posthog from 'posthog-js';

export function initPostHogClient() {
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    // E2E only: lets Playwright force-enable flag-gated routes (e.g. the
    // admin_options_* flags behind FeatureFlagRoleGate) without depending on
    // a real PostHog project/network. Never set outside test runs.
    //
    // `bootstrap.featureFlags` (not a post-init `overrideFeatureFlags` call)
    // is required here: the real `/decide` request this app's dummy/absent
    // API key can never succeed against still completes (or errors) and
    // resets computed flags afterward, clobbering a post-init override.
    // Bootstrapping sets the flags PostHog starts with, before any request
    // resolves, and `advanced_disable_flags` stops that request from ever
    // overwriting them.
    const e2eFlags = process.env.NEXT_PUBLIC_E2E_FEATURE_FLAGS;
    const e2eFlagList = e2eFlags
      ? e2eFlags.split(',').map(flag => flag.trim()).filter(Boolean)
      : [];

    // posthog.init() aborts entirely (never sets __loaded, never applies
    // `bootstrap`) when given a falsy/blank token — see posthog-js's
    // `_init()`. CI/e2e runs never set NEXT_PUBLIC_POSTHOG_KEY, so without
    // this fallback the bootstrap.featureFlags override below would
    // silently never apply.
    const posthogToken =
      process.env.NEXT_PUBLIC_POSTHOG_KEY ||
      (e2eFlagList.length > 0 ? 'phc_e2e_dummy_token' : undefined);

    posthog.init(posthogToken!, {
      api_host: '/d4t4-3nc4nt0/',
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'always',
      defaults: '2025-05-24',
      capture_pageview: false,
      capture_pageleave: true,
      ...(e2eFlagList.length > 0 && {
        bootstrap: {
          featureFlags: Object.fromEntries(e2eFlagList.map(flag => [flag, true])),
        },
        advanced_disable_flags: true,
      }),
    });
  }
  return posthog;
}

export { posthog as posthogClient };