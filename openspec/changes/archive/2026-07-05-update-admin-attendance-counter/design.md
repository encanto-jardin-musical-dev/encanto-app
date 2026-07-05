# Design: update-admin-attendance-counter

## Context

`AdminSummaryPanel` (`src/components/admin/AdminSummaryPanel.tsx`) renders "Asistencia de hoy" with two `AssistanceMetric` blocks fed by the mock `adminAssistance` object. The panel already fetches the real total-children count via `useChildrenCountQuery` for its "Total de Niños" figure. The attendance feature (shipped in `add-attendance-logging`) provides everything needed for a live present-count: staff-readable `attendance` rows keyed on `(child_id, attendance_date)` with `check_in`, and the shared Bogota-local `todayDateString()` helper. The `admin-options-page` spec explicitly anticipated this: its assistance requirement mandates a "swappable data provider … so the provider can later be replaced with live data without changing the UI."

## Goals / Non-Goals

**Goals:**

- Jardín metric shows `count of children currently present (checked-in and not checked-out) / total children`, live.
- Talleres metric, its mock, and its i18n key are removed.
- "Today" matches the attendance feature's day boundary (America/Bogota) exactly.

**Non-Goals:**

- No per-group breakdown, no history, no auto-refresh/realtime — the panel refetches on mount like the rest of the dashboard.
- No workshops replacement metric; the layout simply centers the single metric.
- No RLS or schema changes.

## Decisions

### D1 — Count query: HEAD count on `attendance`, not a fetch

`src/queries/attendance/get-today-present-count.ts` runs `client.from('attendance').select('*', { count: 'exact', head: true }).eq('attendance_date', todayDateString()).not('check_in', 'is', null).is('check_out', null)` and returns the count. A HEAD request with `count: 'exact'` transfers no rows. With multi-cycle attendance a child may have multiple rows; this counts open rows, which equals the number of children currently present.

*Alternative considered*: an RPC — unnecessary; this is a single-table filtered count the client can express, and the read stays consistent with the log screen's `todayDateString()`.

### D2 — Total side reuses the existing children count

The panel already calls `useChildrenCountQuery` for "Total de Niños"; the Jardín metric's `total` reuses that same hook result rather than adding a second children count. One source of truth per number on screen.

### D3 — Hook: `UseTodayPresentCountQuery`

Query key `['today-present-count', todayDateString()]` so the cache naturally rolls over with the attendance day. No invalidation wiring from the clock-in mutations is added — the admin dashboard and the log screen are separate flows, and the dashboard refetches on mount (React Query default staleness applies). This satisfies the spec's swappable-provider intent: the UI still consumes a `{ current, total }` pair, now sourced from hooks.

### D4 — Removal is a deletion, not a hide

`src/lib/mock/adminAssistance.ts` is deleted (grep confirms `AdminSummaryPanel` is its only consumer), the second `AssistanceMetric` is removed from the panel, and `AdminOptionsPage.assistance.workshops` is dropped from `messages/es.json`. The `AssistanceMetric` component itself is untouched — it stays presentational.

## Risks / Trade-offs

- **[Loading/error display]** The count query can be momentarily unresolved; render the same "—" placeholder convention the panel already uses for total kids. → Consistent with the existing "Total of Kids resilience" spec requirement.
- **[Staleness]** An admin keeping the dashboard open while teachers clock children in sees a stale count until refetch. → Accepted; matches the panel's existing behavior for total kids, and navigation back to `/admin` refetches.
- **[Flag independence]** The counter reads attendance data regardless of the `admin_options_attendance` flag. → Acceptable: the flag gates the logging UI, not the data; with the flag off the count is simply 0 until logging starts.

## Migration Plan

Single PR, UI-only. No DB changes; no flag changes. Rollback = revert the commit (the mock file returns with it).

## Open Questions

- The scope decision (wiring live data vs. removal-only) was taken without user confirmation — recorded in the proposal; confirm before or during apply.
