## 1. Baseline

- [x] 1.1 Create a working branch from main
- [x] 1.2 Run `npm audit` and save the baseline report (counts + advisory list) for before/after comparison
- [x] 1.3 Confirm a clean baseline build with `npm run build` and `npm run lint`

## 2. Upgrade Direct Dependencies (within current major)

- [x] 2.1 Bump `next` to the latest patched `15.x` in `package.json`
- [x] 2.2 Bump `@sentry/nextjs` to `10.56.0`
- [x] 2.3 Bump `@serwist/next` and `serwist` to `9.5.11` (keep in lockstep)
- [x] 2.4 Bump `@supabase/supabase-js` to `2.107.0`
- [x] 2.5 Bump `firebase` to `12.14.0` (resolves transitive critical `protobufjs` RCE)
- [x] 2.6 Run `npm install` and review the `package-lock.json` diff to confirm no unexpected major-version changes

## 3. Remediate Remaining Transitive Advisories

- [x] 3.1 Run `npm audit fix` (without `--force`) to resolve transitive advisories (`ajv`, `brace-expansion`, `fast-uri`, `ws`, `yaml`, `@protobufjs/utf8`)
- [x] 3.2 Review the resulting lockfile diff; reject and use `package.json` `overrides` instead if any direct dependency is pushed to a new major
- [x] 3.3 For any advisory still unresolved, evaluate a targeted `overrides` entry if a non-breaking version exists

## 4. Verify Build and Lint

- [x] 4.1 Run `node scripts/generate-firebase-sw.js` (prebuild) and confirm the service worker is generated without errors
- [x] 4.2 Run `npm run build` and resolve any breakage introduced by the upgrades
- [x] 4.3 Run `npm run lint` and confirm no new errors

## 5. Manual Smoke Test (no automated test suite)

- [x] 5.1 Verify authentication and Supabase session handling (sign in/out, RLS-protected query)
- [x] 5.2 Verify realtime messaging subscriptions still deliver updates
- [x] 5.3 Verify Firebase push notification registration and delivery
- [x] 5.4 Verify service worker installs and offline/PWA behavior works
- [x] 5.5 Verify Sentry initializes and reports a test event

## 6. Confirm Remediation and Document

- [x] 6.1 Re-run `npm audit` and confirm no critical/high vulnerabilities with a non-breaking fix remain
- [x] 6.2 Document any vulnerability deferred because it requires a major-version upgrade (package, severity, reason)
  <!-- DEFERRED: postcss < 8.5.10 (moderate — GHSA-qx2v-qp2m-jg93, XSS via unescaped </style>). Bundled inside next/node_modules/postcss@8.4.31 which is pinned by Next.js 15.5.19 itself. npm audit fix --force would downgrade next to 9.3.3. Deferred until Next.js publishes a patch with postcss >= 8.5.10. -->
- [x] 6.3 Commit `package.json` and `package-lock.json` with a clear security-update message and open a PR
