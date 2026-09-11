# unit-testing Specification

## Purpose
Defines the project's unit testing setup: the Vitest runner, the requirement that query/hook functions have coverage, the mocking of the Supabase client, and the coverage threshold enforced on scoped directories.

## Requirements

### Requirement: Vitest unit test runner
The project SHALL use Vitest as its unit test runner, configured via `vitest.config.ts`, with `pnpm test` running the suite once and `pnpm test:watch` running it in watch mode.

#### Scenario: Running the unit suite locally
- **WHEN** a developer runs `pnpm test`
- **THEN** Vitest executes all `*.test.ts` and `*.test.tsx` files under `src/` and reports pass/fail without requiring a running Supabase instance or network access

#### Scenario: Component tests use React Testing Library
- **WHEN** a unit test targets a hook or component with conditional/role-based logic
- **THEN** the test renders it via React Testing Library and asserts on observable behavior (rendered output, called callbacks) rather than implementation details

### Requirement: Query and hook functions are unit tested
Every function in `src/queries/` and every hook in `src/hooks/` that contains branching logic (error handling, conditional query params, role-based filtering) SHALL have at least one corresponding unit test.

#### Scenario: Query function success path
- **WHEN** a query function (e.g. `getUserProfile`) is called with valid input
- **THEN** the test asserts the Supabase client mock was invoked with the expected table, filters, and selection, and the function returns the mocked data

#### Scenario: Query function error path
- **WHEN** the mocked Supabase client returns an `error`
- **THEN** the test asserts the query function throws (or returns the documented error shape) rather than silently swallowing the error

### Requirement: Supabase client is mocked in unit tests
Unit tests SHALL mock `src/utils/supabase/client.ts` (and equivalent server/middleware clients where imported) rather than connecting to a real Supabase project, so unit tests run offline and deterministically.

#### Scenario: No network calls during unit tests
- **WHEN** the unit suite runs
- **THEN** no test makes a real HTTP request to a Supabase project URL; all Supabase interactions are intercepted by `vi.mock`

### Requirement: Coverage threshold on scoped directories
The project SHALL enforce a minimum 80% statement/line coverage threshold on `src/queries/**` and `src/hooks/**`, checked via `pnpm test:coverage`, using `@vitest/coverage-v8`. Coverage is not enforced on presentational components or app-router page/layout files.

#### Scenario: Coverage below threshold fails the check
- **WHEN** `pnpm test:coverage` runs and combined coverage for `src/queries/**` or `src/hooks/**` falls below 80%
- **THEN** the command exits with a non-zero status, failing the corresponding CI job

#### Scenario: Coverage check runs in CI
- **WHEN** a pull request is opened or updated against `main`
- **THEN** a CI job runs `pnpm test:coverage` and the PR check reflects its pass/fail result
