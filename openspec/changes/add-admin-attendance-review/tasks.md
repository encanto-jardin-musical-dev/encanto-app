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

## 6. Verification

- [x] 6.1 Run `pnpm lint` and `npx tsc --noEmit`; confirm no leftover `AttendanceAccessGate` references and no hardcoded copy
- [x] 6.2 As admin with the flag on: tapping the counter and the Asistencia tile both open `/admin/attendance`; groups with currently present children render grouped; recording a check-out updates the list (child disappears from view) without a full reload
- [x] 6.3 As teacher: `/admin/attendance` is not accessible even with the flag on; `/attendance` still works
