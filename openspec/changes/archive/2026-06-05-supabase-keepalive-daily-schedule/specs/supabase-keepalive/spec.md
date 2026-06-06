## MODIFIED Requirements

### Requirement: Scheduled keepalive ping
The system SHALL send a GET request to the Supabase REST API once per day to prevent the project from pausing due to inactivity.

#### Scenario: Scheduled ping succeeds
- **WHEN** the cron schedule fires (daily at 12:00 UTC)
- **THEN** the workflow sends a request to `$SUPABASE_URL/rest/v1/profiles?select=id&limit=1` with valid `apikey` and `Authorization` headers and receives a 2xx response

#### Scenario: Ping fails
- **WHEN** the REST request returns a non-2xx response or network error
- **THEN** the workflow step fails, causing GitHub to mark the workflow run as failed and notify the repo owner via email
