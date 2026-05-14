## Context

Supabase free-tier projects pause after 7 days of inactivity. The app is in active development but may go periods without real user traffic. A lightweight ping via GitHub Actions is the standard mitigation — no infrastructure changes needed, just a cron workflow hitting the REST API.

## Goals / Non-Goals

**Goals:**
- Prevent Supabase project from pausing by sending a REST ping twice a week
- Keep credentials out of the workflow file (use GitHub secrets/vars)
- Allow manual re-trigger for convenience

**Non-Goals:**
- Health monitoring or alerting — this is a keepalive only, not observability
- Pinging multiple environments (staging, preview branches)
- Any app code changes

## Decisions

**Endpoint to ping**: `GET /rest/v1/profiles?select=id&limit=1`

The reference used an `events` table which doesn't exist in this project. The `profiles` table always exists (created by the auth trigger) and is readable with the anon key via RLS. Using `limit=1` makes the query cheap regardless of row count.

**Schedule**: Mondays & Thursdays at 12:00 UTC (`0 12 * * 1,4`)

Two pings per week keeps the project well within the 7-day inactivity window with comfortable margin. Alternatives considered: daily (unnecessary overhead), once a week (too close to the limit).

**Auth**: Pass anon/publishable key as both `apikey` header and `Authorization: Bearer` header — this is the standard Supabase REST auth pattern for public endpoints.

**Credential storage**:
- `SUPABASE_PUBLISHABLE_KEY` → GitHub **secret** (not exposed in logs)
- `SUPABASE_URL` → GitHub **variable** (not sensitive, matches Supabase convention)

## Risks / Trade-offs

- [Supabase changes pause policy] → The 7-day threshold could change; if they extend or remove it, the workflow becomes no-ops but causes no harm.
- [Workflow failure goes unnoticed] → GitHub will send email alerts on repeated workflow failures to the repo owner; no extra alerting needed.
- [Anon key rotation] → If `SUPABASE_ANON_KEY` rotates, the secret must be updated in GitHub settings manually. Low frequency risk.

## Migration Plan

1. Add `.github/workflows/supabase-keepalive.yml`
2. In GitHub repo settings → Secrets: add `SUPABASE_PUBLISHABLE_KEY`
3. In GitHub repo settings → Variables: add `SUPABASE_URL`
4. Trigger manually via `workflow_dispatch` to verify it passes
