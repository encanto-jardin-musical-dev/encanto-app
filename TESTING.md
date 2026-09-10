# Testing

This project uses **Vitest** for unit tests and **Playwright** for end-to-end tests.

## Unit tests (Vitest)

**Where they live:** colocated with the source file, e.g. `src/hooks/UseGetUserProfileQuery.ts` → `src/hooks/UseGetUserProfileQuery.test.ts`. Same pattern for `src/queries/`.

**Naming:** `*.test.ts` for plain logic (query functions, hooks without JSX), `*.test.tsx` for anything rendering via React Testing Library.

**Running locally:**

```bash
pnpm test            # run once
pnpm test:watch      # watch mode
pnpm test:coverage   # run with coverage + enforce the 80% gate
```

No running Supabase instance or network access is required — the Supabase client is mocked (see below).

**Mocking Supabase:** query functions and hooks import the singleton client from `@/utils/supabase/client`. Tests mock that module:

```ts
vi.mock('@/utils/supabase/client', () => ({ supabase: mockSupabaseClient }));
```

`src/test/mocks/supabase.ts` exports a chainable mock builder (`select`, `eq`, `single`, etc.) so a test can set up `{ data, error }` for whatever the query awaits, without hitting a real database.

**Coverage scope:** the 80% lines/statements threshold in `vitest.config.ts` applies **only** to `src/queries/**` and `src/hooks/**`. It's deliberately not enforced on presentational components, app-router pages/layouts, or other UI glue — those are cheap to break in ways coverage numbers don't catch, and expensive to keep at 80% for little signal. If you add a new query function or hook with branching logic (error handling, conditional filters, role-based behavior), give it at least one success-path and one error-path test.

## E2e tests (Playwright)

**Where they live:** `e2e/specs/`. Fixtures and setup live in `e2e/fixtures/`.

**Running locally:**

1. Start a local Supabase instance (requires Docker):
   ```bash
   supabase start
   ```
   This applies every migration under `supabase/migrations/` and prints local API URL / anon key / service role key.
2. Copy those values into `.env.local` (see `.env.example` — the `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` keys) and set `E2E_TEST_AUTH_SECRET` to any local-only value.
3. Run the suite:
   ```bash
   pnpm test:e2e
   ```
   `playwright.config.ts`'s `webServer` block boots `pnpm dev` automatically if nothing is already listening on the configured port.

**Fixture data:** `e2e/fixtures/seed.ts` uses the Supabase service role to create one parent, one teacher, and one admin user (`e2e-{role}@encanto.test`), a group with the teacher assigned, a child in that group, and a guardian link from the child to the parent. It tears down any previous run's fixture rows first, so it's safe to re-run. This is a test-only seed script — it does not touch `supabase/seed.sql` or local dev seed data.

**Auth bypass:** e2e tests never drive the real magic-link email flow. `e2e/fixtures/global-setup.ts` signs each fixture user in via the Supabase admin API, then POSTs the resulting access/refresh tokens to a test-only route (`src/app/api/test/session/route.ts`) that sets the app's session cookies. That route 404s unless `E2E_TEST_AUTH_SECRET` is set and `NODE_ENV !== 'production'` — it does not exist in production builds. The resulting authenticated browser context is saved as Playwright `storageState` per role under `e2e/.auth/`.

**Role-scoped projects:** `playwright.config.ts` defines a `parent`, `teacher`, and `admin` project, each preloaded with that role's `storageState`. Specs are scoped to the project(s) they're meant to run under — see the per-file comments in `e2e/specs/` for how.

**Feature-flag-gated routes:** `/attendance`, `/reports`, and `/tasks` are gated behind PostHog feature flags (`admin_options_attendance`, `admin_options_reports`, `admin_options_tasks`) via `FeatureFlagRoleGate`. E2e runs don't depend on a real PostHog project having those flags configured — `playwright.config.ts` sets `NEXT_PUBLIC_E2E_FEATURE_FLAGS` on the dev server it boots, which `src/lib/posthog/client.ts` reads to force those flags on via `posthog.featureFlags.overrideFeatureFlags(...)`. This override only activates when that env var is set — never in a normal `pnpm dev`/production run.

**Scope:** one happy-path spec and one permission-boundary spec per role, covering auth, feed, messaging, daily reports, attendance, tasks, and admin management. This is intentionally not exhaustive — edge cases belong in unit tests, not e2e.

## CI

`.github/workflows/ci.yml` runs on every pull request targeting `main`:

- **`test`** job: `pnpm test:coverage` (fails locally-equivalent if the 80% gate isn't met).
- **`e2e`** job: provisions the Supabase CLI, runs `supabase start` (applying all migrations), then `pnpm test:e2e` against that local instance.

Both jobs currently run with `continue-on-error: true` (report-only, non-blocking) while the suite proves itself stable over a PR cycle or two. Once stable, remove `continue-on-error` from both jobs in `ci.yml` to make them required/blocking checks.
