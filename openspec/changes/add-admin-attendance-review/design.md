# Design: add-admin-attendance-review

## Context

The attendance feature (`add-attendance-logging`, shipped) gave teachers/admins a per-group bulk clock-in/clock-out screen at `/attendance/[groupId]`, gated by `AttendanceAccessGate` (flag `admin_options_attendance` + staff role) and backed by `clock_in_children`/`clock_out_children` RPCs and staff-scoped RLS. That PR's own code review flagged `AttendanceAccessGate` as a one-off that should generalize once a second flag-gated route needed the same mechanism (`/daily-report`, `/tasks` are still stubs; this change is the first real second consumer, with a stricter admin-only variant).

`get-group-attendance.ts` already proved a two-query merge pattern (children join, then a separate attendance-rows query, merged in JS) that avoids fragile multi-level embedded-resource date filters in PostgREST. This change reuses that pattern at school-wide scope instead of per-group scope.

## Goals / Non-Goals

**Goals:**

- One screen for an admin to see every group's today attendance at once.
- Single-child check-out correction, with a confirmation step.
- Reuse existing RPCs/RLS/query patterns; no schema changes.
- Address the prior review's altitude finding by generalizing the gate.

**Non-Goals:**

- No absentee display on this screen (the per-group log screen already owns "who hasn't checked in").
- No check-in editing, no undoing/clearing a check-in, no historical dates — today only, matching the rest of the attendance feature.
- No bulk actions here — this is a single-child correction tool, not a clock-in/out workflow.

## Decisions

### D1 — Route and access: `/admin/attendance`, admin-only, same flag

New page under the existing `/admin` namespace (consistent with `admin-options-page`'s "destinations under `/admin`" convention), not a variant of `/attendance`. Gated by `admin_options_attendance` (same flag as the rest of the feature, so it can be toggled off as one unit) **and** role `admin` specifically — stricter than `/attendance`, which allows teacher or admin.

### D2 — Generalize the gate

Replace `AttendanceAccessGate` with `FeatureFlagRoleGate`:

```ts
type FeatureFlagRoleGateProps = {
  flag: string;
  allowedRoles: UserRole[];
  children: ReactNode;
};
```

Same hydration-safe, flag-resolved-safe behavior (render `null` while unresolved, `notFound()` once resolved and disallowed). `/attendance/page.tsx` and `/attendance/[groupId]/page.tsx` are updated to pass `flag="admin_options_attendance" allowedRoles={[TEACHER, ADMIN]}`; the new `/admin/attendance/page.tsx` passes `allowedRoles={[ADMIN]}`. This is a mechanical rename+parameterize, not a behavior change for the existing routes.

*Alternative considered*: leave `AttendanceAccessGate` as-is and add a second near-identical `AdminAttendanceAccessGate` — rejected; that's exactly the duplication the prior review called out.

### D3 — Data: one query, two round trips, grouped client-side

`get-admin-attendance-overview.ts`:

1. Fetch all groups with their children (`groups -> child_groups -> children`, id/name/avatar — same shape as `get-group-attendance.ts` but for every group, not one).
2. Fetch all attendance rows for `attendance_date = todayDateString()` school-wide (one query, no child-id filter needed since it's already scoped to today).
3. Merge in JS: for each group, keep only children with a matching attendance row that has `check_in` but no `check_out` (currently present kids); drop groups left with zero qualifying children after the filter.

Returns `{ groupId: string; groupName: string; children: AttendanceChildRow[] }[]`. `AttendanceChildRow` is the same shape already defined in `get-group-attendance.ts` (check_in/check_out included) — reused, not redefined.

*Alternative considered*: a single embedded-resource query filtering `children.attendance.attendance_date`. PostgREST supports this but the filter path is fragile against schema/type changes and awkward to express type-safely through the generated Supabase types; the proven two-query merge is one extra round trip but far more maintainable, and the school-wide attendance table for one day is small.

### D4 — Check-out interaction: modal confirmation, single child

Tapping a present (checked-in, no check-out) child opens a modal: child name, formatted check-in time, and a "Registrar salida" button. Confirming calls the existing `clockOutChildren(client, [childId])` query function (already accepts an array; called here with one id) via a new `useAdminCheckOutMutation` hook that invalidates `['admin-attendance-overview', today]`. Children who are not currently present are not included in the results at all, since this screen only shows kids who are still here.

The attendance model supports multiple check-in/check-out cycles per child per day (building occupation control). A child who checked out and then re-entered appears again on this screen with their new check-in time.

*Alternative considered*: instant tap-to-checkout with no modal, matching the log screen's tap-to-select-then-batch-save flow — rejected per the (unanswered, defaulted) interaction decision: a single, semantically destructive-ish action (closing out a child's day) on a review screen warrants a confirmation step, unlike the log screen's easily-reversible multi-select-then-save.

### D5 — Counter is a navigation link, not a new interaction

The existing "Asistencia de hoy" counter in `AdminSummaryPanel` becomes tappable, wrapped in a Next.js `Link` to `/admin/attendance` — the same destination as the new Asistencia tile. It is a pure navigation affordance: no data mutation, no new query. This keeps the counter (owned conceptually by the summary panel) and the detail screen it summarizes discoverable from one tap, and reuses the same route/gate the tile uses.

*Note on overlap with `update-admin-attendance-counter`*: that change wires the counter's value to live data and owns the "Today assistance" requirement's content; this change only wraps the rendered counter in a link and adds a separate "counter links to the attendance overview" requirement. The two changes touch `AdminSummaryPanel.tsx` for orthogonal reasons (data source vs. navigation) — apply order is independent, but if both are open at implementation time, merge the link wrapper around whatever metric markup the counter change lands.

### D6 — Component reuse

The overview grid reuses `EntityAvatarChip` directly (not `AttendanceChildCard`, which is selection-toggle-shaped for the bulk log screen and not appropriate here) wrapped in a plain button that opens the modal. No status overlays are needed since all shown children are present (no check-out yet).

## Risks / Trade-offs

- **[Two round trips at school scope]** Acceptable — same trade-off already accepted in `get-group-attendance.ts`, and the second query has no per-group fan-out cost since it's a single date filter across the whole table.
- **[Stricter admin-only gate diverges from `/attendance`'s staff gate]** Intentional per D1; documented so a future reader doesn't "fix" it to match.
- **[Gate refactor touches already-shipped routes]** `/attendance` and `/attendance/[groupId]` behavior must not change — task list includes an explicit regression check (existing spec scenarios for `admin_options_attendance` gating must still pass unchanged).

## Multi-cycle attendance support

To support building-occupation tracking, the attendance data model allows multiple `attendance` rows per child per day:

1. Drop the `(child_id, attendance_date)` unique constraint.
2. `clock_in_children` always inserts a new row.
3. `clock_out_children` closes only the most recent open row (latest `check_in` with `check_out` null).
4. Read queries derive a child's current status from their latest open row; if no open row exists, the child is currently out.
5. The teacher `/attendance/[groupId]` log screen shows currently-out kids in clock-in mode and currently-in kids in clock-out mode, so re-entry is a normal operation.

## Migration Plan

Single PR. Mechanical gate refactor plus additive UI, plus a database migration and RPC update to support multi-cycle attendance. Rollback = revert migrations + code.

## Open Questions

- The three interaction decisions in the proposal (confirm-modal, no-absentee display, check-out-only) were confirmed by the user: check-out-only (record exit time only, no broader status changes) is the intended scope, and the tappable counter navigates to `/admin/attendance`.
