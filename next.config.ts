import { withSentryConfig } from '@sentry/nextjs';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // Pin the workspace root to this directory. Without it, Next/Turbopack
  // walks up the tree, finds a stray lockfile in $HOME plus pnpm-workspace.yaml,
  // and may infer the wrong root — breaking CSS/module resolution.
  turbopack: {
    root: import.meta.dirname,
  },
  // Ensure the Firebase service worker is generated before build
  experimental: {
    // This ensures our prebuild script runs before Next.js build
    workerThreads: false,
  },
  // PostHog reverse proxy for local development (matches vercel.json rewrites)
  rewrites: async () => {
    return [
      {
        source: '/d4t4-3nc4nt0/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/d4t4-3nc4nt0/:path*',
        destination: 'https://us.posthog.com/:path*',
      },
      {
        source: '/batch/:path*',
        destination: 'https://us.posthog.com/batch/:path*',
      },
    ];
  },
};
const sentryOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: 'encanto-jardin-musical',
  project: 'encanto-app',
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Options that previously lived at the top level now live under `webpack`
  // (the top-level keys were deprecated in @sentry/nextjs v10).
  webpack: {
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
    // Automatically instrument Vercel Cron Monitors.
    automaticVercelMonitors: true,
    // Annotate React components with their full name in breadcrumbs / session replay
    reactComponentAnnotation: {
      enabled: true,
    },
  },
};
const withNextIntl = createNextIntlPlugin();
const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: './public/sw.js',
  // Serwist doesn't support `next dev --turbopack`; the SW isn't used in dev
  // anyway, so disable it outside production to avoid the Turbopack warning.
  disable: process.env.NODE_ENV !== 'production',
});

export default withSentryConfig(
  withNextIntl(withSerwist(nextConfig)),
  sentryOptions
);
