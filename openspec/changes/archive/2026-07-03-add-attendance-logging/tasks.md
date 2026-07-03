# Tasks: add-attendance-logging

## 1. Database migration

- [x] 1.1 Create migration `attendance_rls_and_audit`: add `recorded_by uuid references auth.users(id) default auth.uid()` to `attendance`
- [x] 1.2 Add `public.is_staff(uuid)` SECURITY DEFINER helper (role in teacher/admin), mirroring `is_admin` (stable, pinned `search_path`, execute granted to `authenticated`)
- [x] 1.3 Drop broken `select_attendance` policy; add `staff_select_attendance` (SELECT), `staff_insert_attendance` (INSERT), `staff_update_attendance` (UPDATE) using `is_staff(auth.uid())`; no DELETE policy
- [x] 1.4 Add `clock_in_children(child_ids uuid[])` RPC: upsert one row per child for `current_date` with `status='present'`, `check_in=now()`, `recorded_by=auth.uid()`, `on conflict (child_id, attendance_date)` updating `check_in` only when null
- [x] 1.5 Add `clock_out_children(child_ids uuid[])` RPC: set `check_out=now()` and `recorded_by=auth.uid()` on today's rows for the given children where `check_in` is not null
- [x] 1.6 Apply migration and regenerate `src/types/database.types.ts`

## 2. Data layer (queries + hooks)

- [x] 2.1 Add `src/queries/attendance/get-group-attendance.ts`: fetch the group's children (id, name, avatar) joined with today's attendance rows
- [x] 2.2 Add `src/queries/attendance/clock-in-children.ts` and `clock-out-children.ts` as `supabase.rpc()` wrappers with explicit error handling
- [x] 2.3 Add `src/hooks/UseGroupAttendanceQuery.ts` (query key `['group-attendance', groupId, today]`, enabled when groupId present)
- [x] 2.4 Add `src/hooks/UseClockInMutation.ts` and `UseClockOutMutation.ts`, invalidating the group-attendance query on success

## 3. Group picker page (`/attendance`)

- [x] 3.1 Add `src/components/attendance/AttendanceGroupList.tsx`: teacher sees own groups (`group_teachers`), admin sees all groups with teacher filter `Select`; tapping a group navigates to `/attendance/[groupId]`
- [x] 3.2 Rewrite `src/app/attendance/page.tsx` to render NavigationBar + AttendanceGroupList, gated by `admin_options_attendance` flag (`=== true`) and staff role
- [x] 3.3 Add empty state for a teacher with no assigned groups

## 4. Attendance log page (`/attendance/[groupId]`)

- [x] 4.1 Add `src/components/attendance/AttendanceChildCard.tsx`: selectable card wrapping `EntityAvatarChip` with visible selected indicator, tap toggles selection
- [x] 4.2 Add `src/components/attendance/AttendanceLog.tsx`: HeroUI `RadioGroup` mode toggle (clock-in default), derived mode lists (clock-in: no check-in today; clock-out: check-in and no check-out), selection cleared on mode switch, `present/total` counter, sticky Save button disabled when selection empty
- [x] 4.3 Wire Save to the matching mutation (bulk, single call); on success clear selection (lists refresh via invalidation); show HeroUI toast on error
- [x] 4.4 Add client-side name search filtering the active mode's list (reuse `SearchBar` pattern with controlled value)
- [x] 4.5 Add `src/app/attendance/[groupId]/page.tsx` with NavigationBar (back to `/attendance`), same flag + role gating, and invalid-groupId handling
- [x] 4.6 Add empty states (all children clocked in / none clocked in yet)

## 5. i18n

- [x] 5.1 Add `Attendance` namespace to `messages/es.json`: page titles, mode labels, counter, save, search placeholder, empty states, error toast, teacher filter label

## 6. Verification

- [x] 6.1 Run `pnpm lint` and fix any issues (pre-existing errors in feed/messages components are unrelated to this change; new attendance files are clean)
- [x] 6.2 Verify RLS as parent (no rows readable, writes rejected) and as teacher (can write for a child outside own groups) — verified directly against the database in a rolled-back transaction
- [x] 6.3 Verify end-to-end flow as teacher: pick group → clock in subset → counter updates → switch mode clears selection → clock out subset → lists re-filter — confirmed via manual QA
- [x] 6.4 Verify flag gating: with `admin_options_attendance` off, `/attendance` and `/attendance/[groupId]` deep links do not render content — confirmed via manual QA
