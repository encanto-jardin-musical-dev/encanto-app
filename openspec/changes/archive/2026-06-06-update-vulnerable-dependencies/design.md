## Context

The Next.js 15 / React 19 PWA depends on Supabase (auth, DB, realtime), Firebase (push), Sentry (monitoring), and Serwist (service worker). `npm audit` currently reports 29 vulnerabilities (1 critical, 13 high, 12 moderate, 3 low). Most are reachable through a small set of direct dependencies plus their transitive trees. There is no automated test suite (per AGENTS.md), so verification relies on `next build`, `next lint`, and manual smoke testing of critical flows.

The critical advisory is `protobufjs` (arbitrary code execution), pulled in transitively by `firebase`. The most impactful high advisories are the Next.js cluster (SSRF via middleware redirects, content injection / cache-key confusion in the Image Optimizer, HTTP request smuggling, Server Components DoS) which are all fixed within the `15.x` line.

## Goals / Non-Goals

**Goals:**
- Remediate the critical `protobufjs` RCE and all high-severity advisories that have a non-breaking fix.
- Keep every upgrade within the current major version to minimize regression risk.
- Confirm the app builds, lints, and runs core flows (auth, realtime messaging, push notifications, service-worker/offline) after upgrades.
- Produce a clear record of any vulnerability deferred because it requires a major bump.

**Non-Goals:**
- Major-version upgrades (`next` 16, `eslint` 10, `tailwindcss` 4, `@heroui/react` 3, `typescript` 6, `@supabase/ssr` 0.10).
- Refactoring application code beyond what an upgrade strictly requires.
- Adding a test framework or CI gating (tracked separately).

## Decisions

**1. Pin direct deps to latest patched minor within current major, rather than `npm audit fix --force`.**
Rationale: `--force` would pull `next` to 16 and other majors, introducing breaking changes and a much larger regression surface. Explicit minor bumps (`next` latest 15.x, `@sentry/nextjs` 10.56.0, `@serwist/next`/`serwist` 9.5.11, `@supabase/supabase-js` 2.107.0, `firebase` 12.14.0) keep the blast radius small while clearing the named advisories.
Alternative considered: blanket `audit fix --force` — rejected due to breaking-change risk and loss of control.

**2. Use plain `npm audit fix` (no `--force`) for remaining transitive advisories.**
Rationale: `ajv`, `brace-expansion`, `fast-uri`, `ws`, `yaml`, `@protobufjs/utf8` are nested and resolve via lockfile updates without changing direct deps. `audit fix` reports each as fixable.
Alternative considered: manual `overrides` in package.json — kept as a fallback only if a transitive fix cannot be reached otherwise.

**3. Upgrade `@serwist/next` and `serwist` together to the same version.**
Rationale: They share an internal build pipeline; version skew between the runtime and the build plugin can break service-worker generation (`scripts/generate-firebase-sw.js` runs in `prebuild`). Keeping them lockstep avoids that.

**4. Verify via build + lint + manual smoke test, since no automated tests exist.**
Rationale: Matches project reality (AGENTS.md: no test framework). The smoke test must cover the surfaces touched by upgraded packages: Sentry init, Supabase auth/session, realtime subscriptions, Firebase push registration, and SW install/offline.

**5. Re-run `npm audit` after each batch and record residual findings.**
Rationale: Provides an auditable before/after and surfaces anything that still needs a major bump so it can be deferred explicitly rather than silently ignored.

## Risks / Trade-offs

- **Minor-version upgrades introduce behavior changes** → Mitigation: read changelogs for `next`, `firebase`, `@supabase/supabase-js`, and `@sentry/nextjs`; run full build/lint and manual smoke test before merge.
- **Service-worker regression from Serwist bump** → Mitigation: run `prebuild` SW generation, confirm SW registers and offline still works; keep `@serwist/next` and `serwist` in lockstep.
- **Supabase client minor jump is large (2.49 → 2.107)** → Mitigation: review breaking-change notes, verify auth session handling and RLS-protected queries; rollback by reverting the lockfile if regressions appear.
- **`npm audit fix` could still pull an unexpected transitive major** → Mitigation: review the lockfile diff before committing; reject and use `overrides` if any direct major is touched.
- **Some advisories may have no non-breaking fix** → Mitigation: document them as deferred follow-ups with severity and rationale; do not block this change on them.

## Migration Plan

1. Branch from main; capture baseline `npm audit` output.
2. Bump direct deps in `package.json`, run `npm install`, review lockfile diff.
3. Run `npm audit fix` (no `--force`) for transitive remainders; review lockfile diff again.
4. `npm run build` and `npm run lint`; fix any breakage.
5. Manual smoke test of auth, realtime, push, and service-worker/offline.
6. Re-run `npm audit`; record residual findings and any deferred items.
7. Rollback strategy: revert `package.json` + `package-lock.json` to the baseline commit if a critical regression is found.

## Open Questions

- Are there any environment-specific Sentry or Firebase config changes required by the new minor versions? (Resolve by reading their migration notes during implementation.)
- Should remaining moderate/low transitive advisories that lack a clean fix be addressed via `overrides`, or deferred? (Decide based on the post-`audit fix` report.)
