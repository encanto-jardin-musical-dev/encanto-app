## Context

`.github/workflows/supabase-keepalive.yml` pings the Supabase REST API on a cron of `0 12 * * 1,4` (Mondays & Thursdays, 12:00 UTC). The Thursday→Monday gap is up to four days, which approaches the inactivity threshold that pauses free-tier Supabase projects. This change is a one-line cron adjustment; no new dependencies, data model, or architectural pattern is involved.

## Goals / Non-Goals

**Goals:**
- Ensure at least one successful keepalive ping per day.
- Keep the workflow otherwise unchanged (target URL, credentials, manual dispatch, failure semantics).

**Non-Goals:**
- Changing the ping target, headers, or credential sourcing.
- Adding retries, alerting, or multiple pings per day.
- Adjusting the time of day (remains 12:00 UTC).

## Decisions

**1. Use cron `0 12 * * *` for a single daily run at 12:00 UTC.**
Rationale: One ping per day keeps the project active with wide margin while keeping request volume negligible and the diff minimal. Keeping 12:00 UTC preserves the existing, proven run time.
Alternative considered: multiple pings per day (e.g., every 6 hours) — rejected as unnecessary for inactivity prevention and noisier.

## Risks / Trade-offs

- **Slightly higher request volume** → Mitigation: a single lightweight `select id limit 1` per day is negligible.
- **A daily failure produces a daily failure email** → Accepted; failures should be visible, and the underlying request is unchanged from today's behavior.
