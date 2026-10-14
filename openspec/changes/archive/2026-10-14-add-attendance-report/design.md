## Context

- Attendance is written by `clock_in_children` / `clock_out_children` RPCs into `public.attendance` (`child_id`, `attendance_date`, `check_in`, `check_out`, `recorded_by`, `status`). A child can have **several rows per day** (re-entry after checkout). `attendance_date` is the school's local day (`America/Bogota`); `check_in`/`check_out` are `time without time zone` columns holding the **UTC** time of day (the clock RPCs insert `now()` under a UTC session).
- Attendance RLS (`assigned_staff_select_attendance`): admins see all rows; teachers see rows only for children currently in groups assigned to them. An index exists on `(child_id, attendance_date)`, which matches the report's access pattern exactly.
- Plus button and desktop sidebar both derive their items from `STAFF_ACTIONS` in `src/components/common/navigation.ts`, filtered by `useActionFlagState()` in `src/hooks/UseNavItems.ts`. Adding an entry there covers both mobile and desktop.
- Routes are gated client-side with `FeatureFlagRoleGate` (flag + roles → `notFound()`).
- Group selection for staff already exists: `getAttendanceGroups(client, { teacherId })` / `useAttendanceGroupsQuery`.

## Goals / Non-Goals

**Goals:**
- One screen where a teacher/admin picks a group → one child → date range and sees that child's attendance rows (date, check-in, check-out).
- A downloadable CSV staff can open in Excel/Google Sheets or forward to a family.
- Authorization stays enforced by the database (no new trust in the client).
- Works on mobile (plus button) and desktop (sidebar), behind `admin_options_attendance_report`.

**Non-Goals:**
- Whole-group or multi-child reports, and an "All groups" option for admins.
- A "recorded by" column.
- PDF/XLSX exports, emailing reports, or scheduled reports.
- Editing or correcting attendance from the report.
- Aggregates/analytics (attendance %, totals, charts).
- Parent access to reports.

## Decisions

### 1. Data access: a security-invoker RPC `get_attendance_report`

```sql
get_attendance_report(p_child_id uuid, p_from date, p_to date)
returns table (
  attendance_id uuid, attendance_date date, check_in time, check_out time
)
language sql stable security invoker set search_path = public, pg_catalog
```

- Converts the stored UTC time of day to school-local time (`America/Bogota`) in SQL and orders by the converted value. Selects from `attendance` where `child_id = p_child_id`, `attendance_date between p_from and p_to`, `check_in is not null`; orders by `attendance_date desc, check_in asc`.
- Raises if the caller is not staff (`is_staff(auth.uid())`), if `p_to < p_from`, or if the inclusive span exceeds **90 days** (`p_to - p_from > 89`).
- **Security invoker** so the existing attendance RLS decides visibility: a teacher passing a child outside their groups gets zero rows.
- The group is only a UI step to narrow the child list; it is not a parameter, because authorization already comes from RLS on the child's rows.
- Created via `supabase migration new add_attendance_report_rpc`, verified locally (`supabase db reset`), then Supabase MCP `get_advisors` is checked. Types regenerated with `supabase gen types`.

*Alternatives:* (a) a plain `.from('attendance').select(...)` query — viable since there are no joins now, but the 90-day cap and staff check would then live only in the client; the RPC keeps those rules server-side and matches the documented `supabase.rpc()` pattern. (b) `SECURITY DEFINER` — bypasses RLS and would re-implement teacher scoping; rejected.

### 2. One row per attendance record, most recent day first

Multiple check-in/out cycles per day are real, so the report lists every row, ordered by date descending (most recent day first), then check-in ascending within the same day so a day reads in the order events happened. Days with no record are **not** fabricated as "absent" rows (ranges may include weekends/holidays), keeping the CSV faithful to stored data.

### 3. Route and screen structure

- Route: `src/app/(app)/attendance-report/page.tsx` (not `/attendance/report`) so it doesn't collide with `/attendance/[groupId]`, doesn't inherit the `admin_options_attendance` flag semantics, and the sidebar's Attendance highlight doesn't light up on the report.
- Page wraps content in `FeatureFlagRoleGate flag="admin_options_attendance_report" allowedRoles={[TEACHER, ADMIN]}` with `NavigationBar backRoute="/feed"`.
- A client component `AttendanceReport` holds the selection state and renders a **filters form** and the **results**. Mobile stacks vertically; desktop (`lg:`) puts filters in a left column and results in the main area.
- Steps are progressive: the child selector is disabled until a group is chosen and resets when the group changes; Generate is disabled until group + child + valid range. Changing any filter after generating clears results until Generate is pressed again, so rows always match the visible filters.

Components (under `src/components/attendance/report/`):
- `AttendanceReport.tsx` — state + orchestration.
- `ReportGroupSelect.tsx` — HeroUI `Select` fed by `useAttendanceGroupsQuery(isAdmin ? undefined : userId)`.
- `ReportChildSelect.tsx` — HeroUI single-selection `Select` (or `Autocomplete` for large groups) fed by a new `getGroupChildren` query + `useGroupChildrenQuery`.
- `ReportDateRange.tsx` — preset chips (Today, Last 7 days, This month, Last month, Custom) + HeroUI `DateRangePicker` for Custom. Default preset: **Last 7 days**.
- `ReportResults.tsx` — child name heading, row count, mobile cards / desktop `Table` (Date, Check-in, Check-out), loading skeleton, empty state, error state, Download button.

### 4. Query + hook

- `src/queries/attendance/get-attendance-report.ts`: `getAttendanceReport(client, { childId, from, to })` → `client.rpc('get_attendance_report', ...)`, throws on `error`, returns `AttendanceReportRow[]`.
- `src/hooks/UseAttendanceReportQuery.ts`: `useQuery` with key `['attendance-report', childId, from, to]`, `enabled` only with a submitted filter snapshot (not the live form state), `staleTime` 1 minute.

### 5. Date presets and timezone

- A pure helper `getReportDateRange(preset, today)` in `src/utils/dates.ts` returns `{ from, to }` as `YYYY-MM-DD` strings computed from the school's "today" (`todayDateString()`), so presets agree with how `attendance_date` is written. `isValidReportRange(from, to)` enforces order and the 90-day cap (mirrors the RPC). "This month" and "Last month" never exceed 31 days, so presets are always valid.
- The RPC returns school-local times, so the client only trims them to `HH:mm` (no client-side timezone conversion). A missing `check_out` renders a localized "Sin salida".

### 6. Download: client-side CSV

CSV is the only export format (confirmed). `buildAttendanceReportCsv(rows, headers)` in `src/utils/attendanceReportCsv.ts`: columns Date, Check-in, Check-out (localized headers passed in from `next-intl`), RFC 4180 quoting, `\r\n`, `﻿` BOM, times already formatted in school TZ, and cells starting with `=`, `+`, `-`, `@` prefixed with `'` to prevent formula injection. Downloaded via `Blob` + `URL.createObjectURL` + temporary `<a download>`. Filename: `asistencia_<child-slug>_<from>_<to>.csv`, so the child is identified even though there is no name column.

*Alternatives considered:* XLSX (heavy dependency), PDF via library or `window.print()` (layout/font work, inconsistent on iOS PWA), server-side generation (unneeded for ≤90-day single-child ranges).

### 7. Navigation + flag wiring

- Add `{ key: "attendance-report", route: "/attendance-report", icon: DocumentChartBarIcon, flag: "admin_options_attendance_report" }` to `STAFF_ACTIONS` right after `attendance`.
- Add `admin_options_attendance_report` to `useActionFlagState()`.
- The plus-button menu still requires the menu-level `action_button_options` flag (unchanged); the sidebar shows the item based on the per-action flag alone, consistent with other actions.
- Add `ActionButton.actions.attendance-report: "Reporte de asistencia"` and an `AttendanceReport` namespace.

## Risks / Trade-offs

- [A teacher sees a child's full history, including days before the child joined that teacher's group, because RLS checks *current* group membership] → Accepted; matches existing attendance visibility rules.
- [A child moved out of a teacher's group disappears from the teacher's report options] → Accepted; admins can still report on any child.
- [CSV formula injection via user-entered names in the filename/heading] → Sanitize cells; filename is slugified.
- [iOS PWA download behavior for Blob URLs] → Test on iOS standalone; the fallback is a preview sheet with Share/Save, which is acceptable.

## Migration Plan

1. Create migration with the RPC; `supabase db reset` locally; run advisors; regenerate types.
2. Ship code behind `admin_options_attendance_report` (off by default in PostHog).
3. Apply the migration to production before the frontend deploy that calls it — the RPC is additive, so ordering is safe.
4. Enable the flag for internal admins → teachers.
5. Rollback: turn the flag off; the RPC can stay unused or be dropped by a follow-up migration.

## Open Questions

None. Resolved: CSV is the only export format; the maximum range is 90 days; reports are per child within the selected group (no whole-group or all-groups report); "recorded by" is not shown.
