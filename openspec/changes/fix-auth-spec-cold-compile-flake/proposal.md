## Why

`e2e/specs/auth.spec.ts` fails intermittently in CI, showing up as "1 flaky" and relying on `retries: 2` to pass. It is the first test of the run and the only one asserting a **client-side** redirect, so it pays the entire cold-start cost of the suite inside a 5-second assertion budget.

The failure is deterministic in shape: across two CI runs on PR #131 it failed on attempt 1 and passed on retry, every time. That signature is a one-time warm-up cost, not a race — a genuinely flaky assertion would pass and fail roughly evenly across retries. It has been tolerated because retries mask it, but a suite that reports flakes trains reviewers to ignore red.

## What Changes

- **Warm the app's routes in Playwright `globalSetup`, before any test runs.** CI starts `pnpm dev`, so the first request to a route triggers on-demand compilation; `/feed` is the heaviest route in the app (parallel routes `@group` + `@user`, root providers, `UserHydrator`, and the message/task/report queries). Route compilation is auth-independent, so unauthenticated warm-up requests are sufficient. This addresses the root cause and speeds up the whole suite.
- **Raise the assertion timeout in `auth.spec.ts`** for the two URL assertions, since a `supabase.auth.getUser()` round-trip to GoTrue remains even on a warm server.
- **Report genuine failures instead of relying on retries to hide them**, so a real regression in the redirect path cannot be absorbed as a flake.

Explicitly **not** doing the architectural fix here — see Non-Goals below.

## Capabilities

### New Capabilities
- `e2e-test-determinism`: The e2e suite SHALL NOT report a test as flaky due to cold application start-up. Routes the suite exercises SHALL be compiled before any test asserts on them, and redirect assertions SHALL carry a timeout that accommodates server start-up rather than a nominal sub-second figure.

### Modified Capabilities
<!-- None. The existing `e2e-testing` spec covers the runner, the seeded local
     Supabase instance, role-flow coverage, and the CI job. None of those
     requirements change — this adds a determinism guarantee, it does not alter
     what the suite runs or where it runs. -->

## Impact

- **Code**
  - `e2e/fixtures/global-setup.ts` — add a route warm-up pass after seeding, before storage states are written.
  - `e2e/specs/auth.spec.ts` — raise the timeout on the `toHaveURL` assertions.
- **Test infrastructure only.** No application source changes, no new dependency, no schema/migration, no i18n.
- **CI** — `ci.yml` unchanged; the warm-up rides along in `globalSetup`, which `pnpm test:e2e` already invokes.
- **Effect on the suite** — the first test stops paying compilation cost, so total wall-clock should drop as well as stabilise.

## Non-Goals

- **No server-side redirect for `/`.** `src/app/page.tsx` is a client component that always renders the logged-out landing before `<AuthRedirect />` pushes `/feed`. Resolving the session server-side and calling `redirect('/feed')` would remove the client-side race entirely and is arguably the more correct architecture — but it changes user-visible behaviour (an authenticated user would never see the landing page flash), and `AuthRedirect`'s docstring notes it is a client component specifically so its parents can use `useTranslations`. That belongs in its own change.
- **No change to `retries: 2`.** It is correct insurance for genuine network variance; it should stop masking this particular class of failure rather than be removed.
- **No rework of `teardownFixtures`.** That has a separate pre-existing FK-ordering defect; out of scope.