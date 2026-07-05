# Proposal: add-admin-attendance-review

## Why

Admins can currently only review today's attendance by picking one group at a time via the teacher-facing `/attendance/[groupId]` log screen. There is no single place for an admin to see the whole school's attendance for today at a glance, or to correct a child's record (e.g. record a check-out an admin observed directly, or fix a case where the assigned teacher couldn't).

> Three interaction decisions below were made without user confirmation (no response to a clarifying question) — flagged so they can be overridden before `/opsx:apply`:
> 1. Tapping a checked-in child opens a confirmation modal before recording check-out (not an instant silent write).
> 2. The list shows only children who are currently present (checked-in but not yet checked-out) — not the full roster with absentees or already-departed children, since the existing per-group log screen already owns those views.
> 3. "Modify" is scoped to recording check-out only; clearing/undoing a check-in is out of scope.

## What Changes

- New admin-only screen at `/admin/attendance`: every group with currently present children, each as a labeled section, listing only children who are checked-in but not yet checked-out (kids who are still here right now).
- Tapping a **present** (currently checked-in, not yet checked-out) child opens a confirmation modal showing their check-in time and a "Registrar salida" action; confirming records their check-out using the existing `clock_out_children` RPC (called with a single child id).
- Children who are not currently present are not shown on this screen at all.
- Attendance tracks building occupation: a child may check out and re-enter multiple times on the same day; each new check-in creates a fresh record and the child appears again on this screen while inside.
- A new "Asistencia" tile added to the Admin Options shortcuts section (currently four tiles — Groups, Children, Teachers, Parents — becoming five), navigating to `/admin/attendance`.
- The "Asistencia de hoy" summary counter on the Admin Options screen becomes tappable, navigating to `/admin/attendance` — the same destination as the tile — so the count acts as a shortcut into the detail it summarizes.
- Route gated behind the existing `admin_options_attendance` flag AND the admin role specifically (stricter than the teacher/admin log screen, which allows either role) — extracted into a small parameterized gate component shared with the existing `/attendance` gate, addressing a "generalize this" note from the prior attendance PR's code review.
- New data layer: one query fetching all groups' today attendance in a single pass (reusing the two-query merge pattern already proven in `get-group-attendance.ts`), and a check-out mutation scoped to the overview's cache key.

## Capabilities

### New Capabilities

- `admin-attendance-review`: admin-only, all-groups view of today's attendance with single-child check-out editing.

### Modified Capabilities

- `admin-options-page`: the "Entity creation shortcuts" requirement's four-tile enumeration becomes five tiles (adds Asistencia); the "Localized text source" enumeration gains the new tile's label; a new requirement makes the Today assistance counter a tappable link to `/admin/attendance`.

## Impact

- **Code**: `src/app/admin/attendance/page.tsx` (new), `src/components/admin/attendance/*` (new: overview, group section, check-out modal), `src/components/admin/AdminShortcuts.tsx` (new tile), `src/components/admin/AdminSummaryPanel.tsx` (Today assistance counter wrapped in a navigation link to `/admin/attendance`), `src/queries/attendance/get-admin-attendance-overview.ts` (new), `src/hooks/UseAdminAttendanceOverviewQuery.ts` + `UseAdminCheckOutMutation.ts` (new).
- **Shared refactor**: extract the flag+role gating from `src/components/attendance/AttendanceAccessGate.tsx` into a parameterized gate reusable by both `/attendance` (teacher or admin) and `/admin/attendance` (admin only).
- **Database**: migration drops the `(child_id, attendance_date)` unique constraint so multiple check-in/check-out records per child per day are allowed; `clock_in_children` inserts new rows and `clock_out_children` closes only the most recent open row. Reuses existing staff-scoped RLS.
- **i18n**: new `AdminAttendance` namespace in `messages/es.json`; one new key in the existing `AdminOptionsPage.tiles` namespace.
- **No impact** on the teacher-facing `/attendance` flow's behavior, the admin summary counter (separate change), messaging, or feed.
