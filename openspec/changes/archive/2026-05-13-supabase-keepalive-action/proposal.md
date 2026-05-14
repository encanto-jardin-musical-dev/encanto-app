## Why

Supabase free-tier projects pause after 7 days of inactivity, causing downtime when users try to access the app. A scheduled GitHub Action that periodically pings the database will prevent pausing without requiring a paid plan.

## What Changes

- Add `.github/workflows/supabase-keepalive.yml` — a scheduled workflow that pings the Supabase REST API twice a week (Mondays & Thursdays at 12:00 UTC)
- Add GitHub Actions secrets/variables documentation so the team knows what to configure (`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`)

## Capabilities

### New Capabilities

- `supabase-keepalive`: Scheduled GitHub Action that sends a lightweight REST query to keep the Supabase project active

### Modified Capabilities

_(none)_

## Impact

- New file: `.github/workflows/supabase-keepalive.yml`
- Requires two GitHub repository-level configs:
  - Secret: `SUPABASE_PUBLISHABLE_KEY` (the anon/publishable key)
  - Variable: `SUPABASE_URL` (the project REST URL)
- No code changes to the app itself; no dependencies added
