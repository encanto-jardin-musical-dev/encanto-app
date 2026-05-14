## ADDED Requirements

### Requirement: Scheduled keepalive ping
The system SHALL send a GET request to the Supabase REST API twice per week to prevent the project from pausing due to inactivity.

#### Scenario: Scheduled ping succeeds
- **WHEN** the cron schedule fires (Mondays & Thursdays at 12:00 UTC)
- **THEN** the workflow sends a request to `$SUPABASE_URL/rest/v1/profiles?select=id&limit=1` with valid `apikey` and `Authorization` headers and receives a 2xx response

#### Scenario: Ping fails
- **WHEN** the REST request returns a non-2xx response or network error
- **THEN** the workflow step fails, causing GitHub to mark the workflow run as failed and notify the repo owner via email

### Requirement: Manual trigger
The system SHALL allow the workflow to be triggered manually via `workflow_dispatch`.

#### Scenario: Manual dispatch
- **WHEN** a maintainer triggers the workflow manually from the GitHub Actions UI
- **THEN** the ping step executes identically to the scheduled run

### Requirement: Credentials via GitHub secrets and variables
The system SHALL read the Supabase anon key from a GitHub secret and the project URL from a GitHub variable — never hardcoded in the workflow file.

#### Scenario: Credentials resolved at runtime
- **WHEN** the workflow runs
- **THEN** `SUPABASE_PUBLISHABLE_KEY` is sourced from `secrets.SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_URL` from `vars.SUPABASE_URL`, and neither value appears in the workflow logs
