# Proposal: add-attendance-logging

## Why

Teachers and admins currently have no way to record which children are present at the center — the `/attendance` route reached from the plus-button menu is an empty stub, and the existing `attendance` table is unusable because its only RLS policy never matches and no write policies exist. Attendance logging is a core educational feature (the admin dashboard already reserves mock "assistance" metrics for it) and the wireframe is ready.

## What Changes

- Replace the `/attendance` stub page with a **group picker**: teachers see the groups they teach (via `group_teachers`), admins see all groups with an optional teacher filter.
- Add a new **attendance log screen** at `/attendance/[groupId]` matching the wireframe: search bar, Clock in / Clock out mode toggle, multi-select grid of child avatar cards, present/total counter, and a Save button that performs one bulk write.
- **Clock-in mode** lists children in the group with no check-in today; saving upserts one row per selected child (`status='present'`, server-side `check_in` timestamp) keyed on `(child_id, attendance_date)`.
- **Clock-out mode** lists children clocked in today but not yet clocked out; saving sets a server-side `check_out` timestamp on today's rows.
- "Absent" is **derived** — a child with no attendance row today is absent. No `absent` rows are written; the `late` status is out of scope.
- Database migration: drop the broken `select_attendance` RLS policy, add staff-only (teacher/admin) SELECT/INSERT/UPDATE policies — any teacher or admin may record attendance for any child; parents have no access. Add a `recorded_by` column for audit.
- Gate the attendance pages behind the existing `admin_options_attendance` PostHog feature flag (the plus-button menu entry already uses it) so deep links respect the flag.
- New data layer following the query → hook → component pattern (`src/queries/attendance/`, attendance hooks) and new Spanish i18n strings in `messages/es.json`.

## Capabilities

### New Capabilities

- `attendance-logging`: Recording daily child attendance — group selection, clock-in/clock-out flows, bulk save semantics, derived-absent model, feature-flag gating, and staff-only database access rules.

### Modified Capabilities

<!-- none — the plus-button menu entry and its `admin_options_attendance` flag are already specified in `plus-button-actions` and do not change -->

## Impact

- **Database**: new migration on the `attendance` table (RLS overhaul + `recorded_by` column); regenerated `src/types/database.types.ts`.
- **Routes**: `src/app/attendance/page.tsx` (rewritten), `src/app/attendance/[groupId]/page.tsx` (new).
- **Code**: new `src/queries/attendance/*`, new attendance hooks in `src/hooks/`, new components under `src/components/attendance/`; reuses `SearchBar`, `EntityAvatarChip`, `NavigationBar`, HeroUI primitives.
- **i18n**: new `Attendance` keys in `messages/es.json`.
- **Feature flags**: reuses `admin_options_attendance` (no new flags).
- **No impact** on messaging, feed, push notifications, or the Serwist/FCM service workers.
