## 1. Baseline

- [ ] 1.1 Create a working branch from main
- [ ] 1.2 Run `npm audit` and save the baseline report (counts + advisory list) for before/after comparison
- [ ] 1.3 Confirm a clean baseline build with `npm run build` and `npm run lint`

## 2. Upgrade Direct Dependencies (within current major)

- [ ] 2.1 Bump `next` to the latest patched `15.x` in `package.json`
- [ ] 2.2 Bump `@sentry/nextjs` to `10.56.0`
- [ ] 2.3 Bump `@serwist/next` and `serwist` to `9.5.11` (keep in lockstep)
- [ ] 2.4 Bump `@supabase/supabase-js` to `2.107.0`
- [ ] 2.5 Bump `firebase` to `12.14.0` (resolves transitive critical `protobufjs` RCE)
- [ ] 2.6 Run `npm install` and review the `package-lock.json` diff to confirm no unexpected major-version changes

## 3. Remediate Remaining Transitive Advisories

- [ ] 3.1 Run `npm audit fix` (without `--force`) to resolve transitive advisories (`ajv`, `brace-expansion`, `fast-uri`, `ws`, `yaml`, `@protobufjs/utf8`)
- [ ] 3.2 Review the resulting lockfile diff; reject and use `package.json` `overrides` instead if any direct dependency is pushed to a new major
- [ ] 3.3 For any advisory still unresolved, evaluate a targeted `overrides` entry if a non-breaking version exists

## 4. Verify Build and Lint

- [ ] 4.1 Run `node scripts/generate-firebase-sw.js` (prebuild) and confirm the service worker is generated without errors
- [ ] 4.2 Run `npm run build` and resolve any breakage introduced by the upgrades
- [ ] 4.3 Run `npm run lint` and confirm no new errors

## 5. Manual Smoke Test (no automated test suite)

- [ ] 5.1 Verify authentication and Supabase session handling (sign in/out, RLS-protected query)
- [ ] 5.2 Verify realtime messaging subscriptions still deliver updates
- [ ] 5.3 Verify Firebase push notification registration and delivery
- [ ] 5.4 Verify service worker installs and offline/PWA behavior works
- [ ] 5.5 Verify Sentry initializes and reports a test event

## 6. Confirm Remediation and Document

- [ ] 6.1 Re-run `npm audit` and confirm no critical/high vulnerabilities with a non-breaking fix remain
- [ ] 6.2 Document any vulnerability deferred because it requires a major-version upgrade (package, severity, reason)
- [ ] 6.3 Commit `package.json` and `package-lock.json` with a clear security-update message and open a PR
