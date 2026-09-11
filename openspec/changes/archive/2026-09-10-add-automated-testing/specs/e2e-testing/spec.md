## ADDED Requirements

### Requirement: Playwright e2e test runner
The project SHALL use Playwright as its end-to-end test runner, configured via `playwright.config.ts`, with specs under `e2e/`, and `pnpm test:e2e` running the full suite headlessly.

#### Scenario: Running the e2e suite locally
- **WHEN** a developer runs `pnpm test:e2e` with a local Supabase instance running (`supabase start`)
- **THEN** Playwright launches the app against that local instance, runs all specs under `e2e/`, and reports pass/fail

### Requirement: E2e tests run against an isolated, seeded local Supabase instance
E2e tests SHALL run against a local Supabase project seeded with known fixture users for each role (parent, teacher, admin) and associated fixture data (a group, a child, a guardian link), rather than against staging or production.

#### Scenario: Fixture data is seeded before the suite runs
- **WHEN** the e2e suite starts (Playwright `globalSetup`)
- **THEN** fixture users, a group, a child, and a guardian relationship are created via the Supabase service role, deterministically, before any test executes

#### Scenario: Suite does not depend on external email delivery
- **WHEN** a test needs an authenticated session for a given role
- **THEN** the session is obtained via the Supabase admin API (not by sending/reading a real magic-link email) and reused via Playwright's `storageState`

### Requirement: Critical role flows are covered end-to-end
For each role, at least one e2e test SHALL cover its primary happy path, and at least one SHALL cover a permission boundary (a user cannot see/do something outside their role or guardianship).

#### Scenario: Parent happy path
- **WHEN** a seeded parent logs in
- **THEN** they can view their feed, open a message thread with a teacher, send a message with an attachment, and see their child's daily reports and attendance

#### Scenario: Teacher happy path
- **WHEN** a seeded teacher logs in
- **THEN** they can clock in/out for attendance, post a daily report to their group, create a group task, and message a guardian

#### Scenario: Admin happy path
- **WHEN** a seeded admin logs in
- **THEN** they can view the admin dashboard and navigate to children, groups, teachers, and parents management screens

#### Scenario: Permission boundary is enforced
- **WHEN** a seeded parent attempts to navigate to another parent's child's data or to an admin-only route
- **THEN** the app denies access (redirect, 403, or empty/filtered result) consistent with the RLS policy for that role

### Requirement: E2e suite runs in CI on pull requests
The e2e suite SHALL run in CI on every pull request targeting `main`, using a local Supabase instance provisioned in the CI job, and SHALL block merge on failure once past an initial stabilization period.

#### Scenario: E2e job runs on PR
- **WHEN** a pull request is opened or updated against `main`
- **THEN** a CI job provisions a local Supabase instance, applies migrations, seeds fixtures, runs `pnpm test:e2e`, and reports the result as a PR check
