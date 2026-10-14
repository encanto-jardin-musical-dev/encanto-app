## Why

Staff log check-in/check-out every day, but there is no way to look back at that history: teachers and admins cannot answer "when did this child arrive and leave last week?" or hand an attendance summary for a child to the school or a family. The data already exists in `attendance`; we need a read-only report on top of it.

## What Changes

- Add an **Attendance Report** action to the staff plus-button menu and to the desktop sidebar (both read the shared `STAFF_ACTIONS` list), gated by the PostHog flag `admin_options_attendance_report` and visible to teachers and admins only.
- Add a new screen at `/attendance-report` with a guided flow: **select group → select one child from that group → select a date range (presets: Today, Last 7 days, This month, Last month, or a custom range up to 90 days) → Generate report**. Reports are always for a single child; there is no whole-group report.
- Teachers can only pick groups assigned to them; admins can pick any group (same scoping as the existing attendance group list).
- Render the report in-app with the child's name as the heading and one row per attendance record showing: attendance date, check-in time, and check-out time, sorted with the most recent day first and, for days with multiple check-ins, by check-in time (earliest first). Times are shown in the school timezone (`America/Bogota`). Mobile renders stacked cards; desktop renders a table.
- Add a **Download CSV** action on the generated report, built client-side from the same rows (UTF-8 with BOM so Excel opens Spanish characters correctly). CSV is the only export format.
- Add a Postgres RPC `get_attendance_report(child_id, from, to)` (security invoker, so existing attendance RLS still applies) that enforces the 90-day maximum range.
- Add Spanish copy for every new string in `messages/es.json`.

## Capabilities

### New Capabilities
- `attendance-report`: Staff-facing per-child attendance report — the selection flow (group, single child, date range with presets), the data contract and authorization of the report query, the in-app report display, empty/error states, CSV download, and the `admin_options_attendance_report` route gate.

### Modified Capabilities
- `plus-button-actions`: The staff sub-options menu gains an Attendance Report action, individually gated by `admin_options_attendance_report`.
- `desktop-layout`: The sidebar gains an Attendance Report item for staff, gated by the same flag.

## Impact

- **Database**: new migration adding `public.get_attendance_report(...)`; regenerate `src/types/database.types.ts`. No table or RLS changes.
- **Code**: `src/components/common/navigation.ts` (new `STAFF_ACTIONS` entry), `src/hooks/UseNavItems.ts` (new flag read), new route `src/app/(app)/attendance-report/page.tsx`, new components under `src/components/attendance/report/`, new query `src/queries/attendance/get-attendance-report.ts` + hook `src/hooks/UseAttendanceReportQuery.ts`, reuse of `useAttendanceGroupsQuery` and a group-children query, CSV utility in `src/utils/`.
- **i18n**: new `ActionButton.actions.attendance-report` key and an `AttendanceReport` namespace in `messages/es.json`.
- **Feature flags**: `admin_options_attendance_report` (already created in PostHog).
- **Dependencies**: none (CSV is generated without a library; date range uses HeroUI `DateRangePicker` + existing `@internationalized/date`).
- **Tests**: unit tests for query, hook, CSV builder, preset-range helper and nav filtering; an e2e spec for the happy path.
