## Why

The delivery briefing prepared for stakeholders flagged that the project has no automated test suite: regressions in auth, RLS-sensitive queries, and the messaging/attendance flows are only caught by manual QA and by Sentry after the fact. Before a wider rollout, the team needs a baseline of automated coverage that catches breakage before it merges, without turning testing into its own maintenance burden.

## What Changes

- Add **Vitest** for unit/component testing of query functions, hooks, and pure logic (React Testing Library for component-level tests where useful).
- Add **Playwright** for end-to-end testing of the critical user flows (auth, messaging, feed, daily reports, attendance, tasks) across the three roles (parent, teacher, admin).
- Wire both test runners into CI (GitHub Actions / the existing PR checks) so a PR fails if tests fail.
- Set an **80% coverage target** for unit tests, scoped to `src/queries/`, `src/hooks/`, and other pure/testable logic — not enforced with lower-value UI glue code, and not chasing 100%.
- Add `pnpm test`, `pnpm test:e2e`, and `pnpm test:coverage` scripts.
- Document the testing conventions (where tests live, naming, how to run locally and against local Supabase) in `CLAUDE.md` or a dedicated `TESTING.md`.

## Capabilities

### New Capabilities
- `unit-testing`: Vitest-based unit/component test setup, conventions, and the 80% coverage target for query/hook/logic code.
- `e2e-testing`: Playwright-based end-to-end test setup covering the critical flows for each role, run against a local/test Supabase instance.

### Modified Capabilities
(none — this introduces testing infrastructure without changing existing product-facing requirements)

## Impact

- **New dev dependencies**: `vitest`, `@vitejs/plugin-react` (or equivalent), `@testing-library/react`, `@testing-library/jest-dom`, `@vitest/coverage-v8`, `@playwright/test`.
- **New config files**: `vitest.config.ts`, `playwright.config.ts`.
- **New directories**: `src/**/*.test.ts(x)` colocated unit tests, `e2e/` for Playwright specs.
- **CI**: GitHub Actions workflow (or existing pipeline) gains a test job; PR checks now include unit + e2e results.
- **Local dev**: contributors need a local/test Supabase project (via `supabase start`) to run e2e tests against; `.env.test` or equivalent for test credentials.
- **No breaking changes** to existing application code — this is additive tooling and process.
