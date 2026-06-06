## Why

The Supabase keepalive workflow currently pings only on Mondays and Thursdays (`0 12 * * 1,4`). A gap of up to four days (Thursday → Monday) risks the free-tier Supabase project pausing due to inactivity before the next ping. Running the keepalive daily guarantees activity well within the inactivity window.

## What Changes

- Change the `supabase-keepalive.yml` workflow cron from `0 12 * * 1,4` (Mondays & Thursdays) to `0 12 * * *` (every day at 12:00 UTC).
- Update the `supabase-keepalive` spec requirement from "twice per week" to "once per day".
- No change to the ping target, credentials handling, manual `workflow_dispatch` trigger, or failure behavior.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `supabase-keepalive`: The scheduled keepalive ping requirement changes from twice weekly (Mondays & Thursdays) to daily.

## Impact

- **Files**: `.github/workflows/supabase-keepalive.yml`.
- **Systems**: GitHub Actions scheduler; Supabase REST endpoint (slightly higher but still negligible request volume).
- **Risk**: Minimal — same request, only more frequent.
