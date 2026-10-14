## 1. Database

- [x] 1.1 Create migration `supabase migration new add_attendance_report_rpc` defining `public.get_attendance_report(p_child_id uuid, p_from date, p_to date)` returning `attendance_id, attendance_date, check_in, check_out` — `stable`, `security invoker`, `set search_path = public, pg_catalog`; filters `child_id = p_child_id`, `attendance_date between p_from and p_to`, `check_in is not null`; orders by `attendance_date desc, check_in asc`
- [x] 1.2 Add guards in the function: raise if `not is_staff(auth.uid())`, if `p_to < p_from`, or if `p_to - p_from > 89` (90-day inclusive cap); `grant execute` to `authenticated` only and revoke from `anon`/`public`; add a `COMMENT ON FUNCTION`
- [ ] 1.3 Apply locally with `supabase db reset` and verify via SQL as admin, as an assigned teacher, as a non-assigned teacher (expect 0 rows) and as a parent (expect error); check 90 vs 91-day ranges
- [ ] 1.4 Run Supabase advisors (MCP `get_advisors`) and fix any security/performance findings for the new function
- [ ] 1.5 Regenerate `src/types/database.types.ts` with `supabase gen types typescript --local`

## 2. Queries and hooks

- [x] 2.1 Add `src/queries/attendance/get-attendance-report.ts` exporting `AttendanceReportRow` and `getAttendanceReport(client, { childId, from, to })` calling the RPC and throwing on `error`
- [x] 2.2 Add `src/queries/attendance/get-group-children.ts` returning `{ id, first_name, last_name }[]` for a group ordered by name (reuse the `child_groups` embed pattern from `get-group-attendance.ts`)
- [x] 2.3 Add `src/hooks/UseAttendanceReportQuery.ts` (`['attendance-report', childId, from, to]`, enabled only with a submitted filter snapshot, 1-minute `staleTime`) and `src/hooks/UseGroupChildrenQuery.ts` (`enabled: !!groupId`)
- [x] 2.4 Unit tests (colocated) for both queries and both hooks using the Supabase mock — success, error, empty, and disabled cases — keeping `src/queries/**` and `src/hooks/**` ≥80% coverage

## 3. Utilities

- [x] 3.1 Add `getReportDateRange(preset, today)` to `src/utils/dates.ts` for `today | last7 | thisMonth | lastMonth` returning inclusive `YYYY-MM-DD` bounds, plus `isValidReportRange(from, to)` enforcing order and the 90-day cap; unit-test month boundaries, January→December rollover, leap years, and 90 vs 91 days
- [x] 3.2 Add school-timezone formatters for report date and time (`es-CO`, `SCHOOL_TIMEZONE`) and unit-test the UTC→Bogotá conversion
- [x] 3.3 Add `src/utils/attendanceReportCsv.ts` with `buildAttendanceReportCsv(rows, headers)` (date, check-in, check-out columns; BOM, `\r\n`, RFC 4180 quoting, formula-injection prefix), `downloadCsv(content, filename)` (Blob + object URL + revoke), and `buildReportFilename(childName, from, to)` with a slugified, accent-stripped child name; unit-test quoting, accents, `=`/`+`/`-`/`@` prefixing and filename

## 4. Navigation and feature flag

- [x] 4.1 Add the `attendance-report` entry (route `/attendance-report`, `DocumentChartBarIcon`, flag `admin_options_attendance_report`) to `STAFF_ACTIONS` after `attendance` in `src/components/common/navigation.ts`
- [x] 4.2 Read `admin_options_attendance_report` in `useActionFlagState()` in `src/hooks/UseNavItems.ts`
- [x] 4.3 Add `ActionButton.actions.attendance-report` ("Reporte de asistencia") to `messages/es.json`
- [x] 4.4 Update `UseNavItems.test.tsx` and any `ActionButton`/`Sidebar` tests for the new item (enabled, disabled, loading; teacher vs admin vs parent)

## 5. Report screen

- [x] 5.1 Create `src/app/(app)/attendance-report/page.tsx` with `NavigationBar` (back to `/feed`, localized title) and `FeatureFlagRoleGate flag="admin_options_attendance_report"` for teacher/admin
- [x] 5.2 Add the `AttendanceReport` namespace to `messages/es.json` (title, group/child/date labels, presets, generate, column headers, no check-out, row count, empty, error, retry, download, range validation messages)
- [x] 5.3 Build `ReportGroupSelect` using `useAttendanceGroupsQuery` (teacher → own id, admin → all groups; no "all groups" option)
- [x] 5.4 Build `ReportChildSelect` as a single-selection HeroUI `Select` fed by `useGroupChildrenQuery`; disabled until a group is chosen; no preselection; cleared on group change
- [x] 5.5 Build `ReportDateRange` with preset chips (default Last 7 days) and a HeroUI `DateRangePicker` for Custom, showing validation errors from `isValidReportRange`
- [x] 5.6 Build `AttendanceReport` orchestrator: holds form state, enables Generate only for group + child + valid range, stores a submitted snapshot for the query, clears results when any filter changes after generating; responsive layout (stacked on mobile, filters column + results on `lg:`)
- [x] 5.7 Build `ReportResults`: child name heading, date range and row count, loading skeleton, error with retry, empty state, mobile cards and desktop HeroUI `Table` with date, check-in, check-out (most recent day first, then check-in ascending within a day); Download CSV button hidden when empty
- [x] 5.8 Component tests for `AttendanceReport` covering default preset, child reset on group change, generate enablement, stale-result clearing, empty state, and CSV download trigger

## 6. E2E and verification

- [x] 6.1 Seed local attendance rows for an e2e child (including a day with two check-ins and an open row without check-out)
- [x] 6.2 Add `e2e/specs/attendance-report.spec.ts`: staff opens the report from the plus button, selects group and child, picks "This month", generates, sees rows in date/check-in order, downloads the CSV and asserts headers/row count; and a parent gets not-found
- [ ] 6.3 Run `pnpm lint`, `pnpm test:coverage`, and `pnpm test:e2e`
- [ ] 6.4 Manually verify on mobile and desktop viewports (and iOS PWA download behavior) with the flag on and off

## 7. Rollout

- [ ] 7.1 Apply the migration to the remote project (`supabase db push` or MCP `apply_migration`) before deploying the frontend
- [ ] 7.2 Enable `admin_options_attendance_report` in PostHog for internal admins first, then teachers
