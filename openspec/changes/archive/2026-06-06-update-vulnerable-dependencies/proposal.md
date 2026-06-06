## Why

`npm audit` reports **29 known vulnerabilities (1 critical, 13 high, 12 moderate, 3 low)** in the current dependency tree, including arbitrary code execution in `protobufjs` and multiple high-severity Next.js advisories (SSRF, content injection, cache-key confusion, request smuggling, and DoS). These expose the production PWA and its users to real attack vectors, and several fixes are available now without breaking changes.

## What Changes

- Upgrade direct dependencies that carry security fixes within their current major versions:
  - `next` `15.3.6` → latest patched `15.x` (resolves SSRF, content injection, cache-key confusion, request smuggling, DoS advisories)
  - `@sentry/nextjs` `10.5.0` → `10.56.0` (fixes vulnerable `@sentry/webpack-plugin` → `uuid`)
  - `@serwist/next` `9.1.1` → `9.5.11` and `serwist` `9.1.1` → `9.5.11` (fixes vulnerable `glob`)
  - `@supabase/supabase-js` `2.49.8` → `2.107.0` (fixes `@supabase/auth-js` insecure path routing)
  - `firebase` `12.0.0` → `12.14.0` (resolves transitive critical `protobufjs` RCE)
- Run `npm audit fix` to remediate remaining transitive advisories (`ajv`, `brace-expansion`, `fast-uri`, `ws`, `yaml`, `@protobufjs/utf8`) where a non-breaking fix is available.
- Verify the application still builds, lints, and runs (auth, real-time, push notifications, service worker) after upgrades.
- Document any vulnerability that cannot be remediated without a major-version bump and defer it as a follow-up.
- **Non-goals**: Major-version upgrades (e.g., `next` 16, `eslint` 10, `tailwindcss` 4, `@heroui/react` 3, `typescript` 6) and broad feature work are out of scope.

## Capabilities

### New Capabilities
- `dependency-security`: Defines the requirement that the project's dependency tree remains free of known unresolved high/critical vulnerabilities and the process for verifying remediation after upgrades.

### Modified Capabilities
<!-- No existing capability requirements change; this is a maintenance/security change. -->

## Impact

- **Files**: `package.json`, `package-lock.json`.
- **Dependencies**: `next`, `@sentry/nextjs`, `@serwist/next`, `serwist`, `@supabase/supabase-js`, `firebase`, plus transitive packages resolved by `npm audit fix`.
- **Systems**: Next.js build & runtime, Sentry instrumentation, service worker / PWA (Serwist), Supabase auth & realtime, Firebase push notifications.
- **Risk**: Minor-version upgrades may introduce subtle behavior changes; mitigated by build, lint, and manual smoke testing of critical flows.
