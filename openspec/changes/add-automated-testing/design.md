## Context

The app has no test framework today (confirmed in `CLAUDE.md`: "No test framework is configured — do not add tests without confirming the approach with the user first"). All logic follows the query → hook → component pattern documented there, with Supabase RLS enforcing access at the database layer. The stakeholder briefing (2026-09) called out the missing test suite as the main delivery gap before wider rollout. The user has confirmed the tools: **Vitest** for unit tests, **Playwright** for e2e, targeting **80% coverage** — explicitly not chasing exhaustive coverage.

## Goals / Non-Goals

**Goals:**
- Catch regressions in query functions, hooks, and critical user flows before merge.
- Keep the suite fast and low-maintenance — 80% coverage on the code worth testing, not 100% everywhere.
- Cover the three roles' critical paths end-to-end: magic-link auth, messaging (incl. attachments), feed, daily reports, attendance, tasks, admin management.
- Run both suites in CI on every PR against `main`.

**Non-Goals:**
- Not testing third-party services themselves (Supabase, Firebase, Sentry, PostHog) — only our integration points.
- Not pursuing 100% coverage or testing trivial UI glue (e.g. simple presentational components with no logic).
- Not replacing manual QA entirely — e2e covers the critical paths, not every edge case.
- Not introducing visual regression testing in this change.

## Decisions

**1. Vitest over Jest for unit tests.**
Next.js 16 + Vite-compatible tooling and the project's ESM (`"type": "module"`) setup make Vitest a lower-friction fit than Jest, which needs extra config for ESM/TS. Vitest also shares config idioms with Vite, has a faster watch mode, and native coverage via `@vitest/coverage-v8`.

**2. Unit test scope: `src/queries/`, `src/hooks/`, and pure utility/logic modules.**
The query → hook → component pattern in `CLAUDE.md` isolates data-access logic from rendering, which is exactly what's cheap and valuable to unit test. Coverage thresholds (80%) apply only to these directories in `vitest.config.ts`, not the whole `src/` tree — testing every presentational component for 80% coverage would be high-maintenance for low signal. React Testing Library is added for the handful of hooks/components with meaningful conditional logic (e.g. role-gated rendering), not for exhaustive component snapshotting.

**3. Mock the Supabase client at the module boundary for unit tests.**
Query functions import a singleton client (`src/utils/supabase/client.ts`). Unit tests mock this module (`vi.mock`) and assert the query shape (table, filters, error handling) rather than hitting a real database — keeping unit tests fast and independent of any running Supabase instance.

**4. Playwright e2e runs against a local Supabase instance (`supabase start`), not against staging/production.**
This keeps e2e runs isolated, repeatable, and safe to reset (`supabase db reset`) between runs, and avoids polluting real data or depending on network state. A seed script (`supabase/seed.sql` or a small TS seeding script run in Playwright's `globalSetup`) creates fixture users for each role (parent, teacher, admin) with known credentials/magic-link bypass for auth in tests.

**5. Auth in e2e: bypass magic-link email delivery.**
Real magic-link flows require an inbox. For e2e, tests will either (a) use Supabase's admin API to mint a session token directly for seeded test users, or (b) read the magic link from Supabase's local Inbucket/mail capture in the local dev stack. Decision: use (a) — generate a session via the Supabase service role in `globalSetup` and inject storage state per role, matching Playwright's recommended "storageState" pattern. This avoids flakiness from email capture entirely.

**6. Coverage enforcement: 80% lines/statements on the scoped directories, checked in CI, not blocking locally.**
`pnpm test:coverage` runs the threshold check; CI fails the PR if it drops below 80% on `src/queries/` and `src/hooks/`. Local `pnpm test` runs without enforcing the gate, to keep the inner dev loop fast.

**7. CI integration: extend the existing PR pipeline rather than create a new one.**
Add a `test` job (Vitest + coverage) and an `e2e` job (Playwright, using `supabase start` in CI via the Supabase CLI GitHub Action or a services container) to the existing lint/build pipeline, run in parallel where possible.

## Risks / Trade-offs

- **[Risk] E2e suite becomes slow/flaky as it grows** → Mitigation: keep e2e scoped to critical paths only (one happy-path + one permission-boundary test per role per flow), push edge-case coverage to unit tests instead.
- **[Risk] Local Supabase in CI adds pipeline time and complexity** → Mitigation: cache the Supabase CLI/Docker layers where possible; run e2e as a separate job from lint/build so it doesn't block fast feedback on trivial PRs.
- **[Risk] Coverage threshold becomes a box-checking target with low-value tests** → Mitigation: scope the 80% gate narrowly (queries/hooks only) where tests naturally have real assertions; do not raise the threshold or widen scope without re-evaluating value.
- **[Risk] RLS behavior differs between local and hosted Supabase** → Mitigation: local Supabase runs the same migrations (`supabase/migrations/`) as production, so RLS policies are identical; e2e tests double as a regression check for RLS/migration correctness.

## Migration Plan

1. Add dependencies and config (`vitest.config.ts`, `playwright.config.ts`) — no impact on existing code.
2. Write unit tests for existing query functions/hooks incrementally until the 80% threshold on scoped directories is met.
3. Write e2e tests for the critical flow per role, starting with auth, then messaging, feed, daily reports, attendance, tasks, admin.
4. Add CI jobs; initially run in report-only (non-blocking) mode for one PR cycle to validate stability, then flip to blocking.
5. Document conventions (`TESTING.md` or a `## Testing` section in `CLAUDE.md`).

No rollback risk to production — this is dev/CI tooling only, added incrementally with no changes to shipped application behavior.

## Open Questions

- Should e2e tests run on every PR, or only on PRs touching relevant paths (to save CI time)? Default: run on every PR until the suite proves itself slow, then revisit.
- Where should seeded fixture data live — a checked-in `supabase/seed.sql` (shared with local dev) or a test-only seeding script? Default: a test-only TS seed script under `e2e/fixtures/` to avoid polluting local dev seed data.
