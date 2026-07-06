# Tasks: add-admin-attendance-review

## 1. Access gate refactor

- [x] 1.1 Rename/generalize `src/components/attendance/AttendanceAccessGate.tsx` into `FeatureFlagRoleGate` taking `{ flag, allowedRoles, children }`, preserving hydration-safe + flag-resolved-safe behavior (render `null` while unresolved, `notFound()` once resolved and disallowed)
- [x] 1.2 Update `/attendance/page.tsx` and `/attendance/[groupId]/page.tsx` to use `FeatureFlagRoleGate` with `flag="admin_options_attendance"` and `allowedRoles={[TEACHER, ADMIN]}`
- [x] 1.3 Regression check: existing `admin_options_attendance` gating scenarios for `/attendance` still pass unchanged

## 2. Data layer

- [x] 2.1 Add `src/queries/attendance/get-admin-attendance-overview.ts`: fetch all groups + children, fetch all today's attendance rows (`attendance_date = todayDateString()`), merge in JS, filter to only present children (check_in exists but check_out is null), drop groups with zero qualifying children; return `{ groupId, groupName, children: AttendanceChildRow[] }[]` (reuse `AttendanceChildRow` from `get-group-attendance.ts`), with explicit error handling
- [x] 2.2 Add `src/hooks/UseAdminAttendanceOverviewQuery.ts` with query key `['admin-attendance-overview', todayDateString()]`
- [x] 2.3 Add `src/hooks/UseAdminCheckOutMutation.ts` calling `clockOutChildren(client, [childId])`, invalidating `['admin-attendance-overview', todayDateString()]`

## 3. Attendance overview screen

- [x] 3.1 Add `src/app/admin/attendance/page.tsx` gated by `FeatureFlagRoleGate` with `allowedRoles={[ADMIN]}`
- [x] 3.2 Add `src/components/admin/attendance/*`: overview list (groups as labeled sections), group section, and check-out confirmation modal
- [x] 3.3 Present (checked-in, no check-out) children are tappable → open modal (name + formatted check-in time + "Registrar salida"); confirming triggers `UseAdminCheckOutMutation`
- [x] 3.4 Already-checked-out children are not shown in the list at all (screen only shows currently present kids)

## 4. Admin Options integration

- [x] 4.1 Add the "Asistencia" tile to `src/components/admin/AdminShortcuts.tsx` (five tiles total) navigating to `/admin/attendance`
- [x] 4.2 Wrap the Today assistance counter in `src/components/admin/AdminSummaryPanel.tsx` in a `Link` to `/admin/attendance` (navigation only, no mutation)

## 5. i18n

- [x] 5.1 Add the `AdminAttendance` namespace to `messages/es.json` (screen title, group section, confirmation modal title/body, "Registrar salida" action)
- [x] 5.2 Add the Asistencia tile label key under the existing `AdminOptionsPage.tiles` namespace

## 6. Multi-cycle attendance support

- [x] 6.1 Add database migration to drop `(child_id, attendance_date)` unique constraint so multiple check-in/check-out records per child per day are allowed
- [x] 6.2 Update `clock_in_children` RPC to always insert a new attendance row on check-in
- [x] 6.3 Update `clock_out_children` RPC to close only the most recent open row (latest check-in without check_out) for each child
- [x] 6.4 Update `src/queries/attendance/get-group-attendance.ts` to derive a child's current status from their most recent open row, showing them as currently present if any open row exists
- [x] 6.5 Update `AttendanceLog.tsx` clock-in mode to show children who are currently out (no open row), including those who checked out earlier today and can re-enter
- [x] 6.6 Update `AttendanceLog.tsx` clock-out mode to show children who are currently in (open row), and visually mark previously-departed children in re-entry cycles if needed

## 7. Verification

- [x] 7.1 Run `pnpm lint` and `npx tsc --noEmit` after multi-cycle changes; confirm no leftover `AttendanceAccessGate` references
- [x] 7.2 Verify a child can check in, check out, and check in again on the same day; each state is reflected correctly in `/attendance/[groupId]` and `/admin/attendance`
- [x] 7.3 Verify existing admin/teacher gating still works
