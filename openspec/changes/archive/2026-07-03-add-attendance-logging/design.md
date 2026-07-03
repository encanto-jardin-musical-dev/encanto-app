# Design: add-attendance-logging

## Context

The `attendance` table already exists with the right shape: `child_id`, `attendance_date` (date), `check_in` / `check_out` (timestamps), `status` enum (`present` | `absent` | `late`), and a `UNIQUE (child_id, attendance_date)` constraint — one row per child per day. However:

- Its only RLS policy is `select_attendance` with `child_id = (select auth.uid())`, which compares a `children.id` to an auth user id and never matches. There are no INSERT/UPDATE policies, so the table is unreadable and unwritable by every client.
- The `/attendance` route (`src/app/attendance/page.tsx`) is a stub rendering only a title.
- The plus-button menu entry and its `admin_options_attendance` PostHog flag already exist (specified in `plus-button-actions`).
- `public.is_admin(uuid)` is an existing SECURITY DEFINER helper reading `profiles.role`; there is no teacher/staff equivalent yet.
- Reusable UI pieces exist: `SearchBar`, `EntityAvatarChip` (avatar + label tile), `NavigationBar`, and HeroUI primitives.

Wireframe contract (settled during exploration): route `/attendance/[groupID]`, search input, Clock in / Clock out radio toggle, multi-select child grid, `present/total` counter, single Save button, automatic timestamps, admin can pick teacher and groups.

## Goals / Non-Goals

**Goals:**

- Teachers and admins can bulk clock-in and clock-out children per group for **today**.
- Any teacher or admin may record attendance for **any** child (DB does not restrict by group; the group is a UI navigation concept only).
- Fix the `attendance` table's RLS so it is usable, staff-only, and auditable (`recorded_by`).
- Fit the app's design system (HeroUI, existing shared components) and i18n (Spanish, `next-intl`).
- Respect the `admin_options_attendance` feature flag on the pages themselves, not just the menu entry.

**Non-Goals:**

- No `late` status handling — deferred until the team decides how lateness works.
- No stored `absent` rows — absence is derived (no row today = absent).
- No parent-facing attendance view and no parent RLS access.
- No historical browsing/editing of past days; the screens operate on today only.
- No attendance reporting/dashboard (the admin dashboard's mock `adminAssistance` metrics stay mocked).
- No changes to the plus-button menu (already implemented and specced).

## Decisions

### D1 — Route structure: `/attendance` (group picker) → `/attendance/[groupId]` (log screen)

Teachers may teach multiple groups and admins need to reach any group, so a picker page precedes the log screen. Teacher sees groups joined via `group_teachers`; admin sees all groups with an optional teacher filter (`Select`), mirroring the per-child teacher filter pattern from messages.

*Alternative considered*: single page with a group dropdown — rejected; the wireframe names the `/attendance/[groupID]` route explicitly and a picker matches existing admin list navigation patterns.

### D2 — Mode toggle is a filter, not a state editor

- **Clock-in mode** lists only children in the group **without** a `check_in` today (the derived-absent set).
- **Clock-out mode** lists only children **with** a `check_in` today and **no** `check_out`.

This removes any need for pre-selected/disabled tile states: every visible tile is actionable. Switching modes **clears the selection** (the lists contain different children). The counter always shows `present today / total group children` regardless of mode.

### D3 — Bulk save with server-side timestamps

Selection is staged purely in client state; nothing persists until Save. Save is **disabled when the selection is empty**.

- Clock-in save: one `upsert` of N rows `{ child_id, attendance_date: today, status: 'present', recorded_by }` with `onConflict: 'child_id,attendance_date'`; `check_in` is set server-side.
- Clock-out save: one `update` setting `check_out` server-side on today's rows for the selected children.

Because Supabase client writes can't call `now()` per column directly, timestamps are applied via **column defaults / trigger** (see D5) rather than client-provided ISO strings — the recorded time is when the save hit the database, not when a tile was tapped. After a successful save the group-attendance query is invalidated, lists re-filter, and the selection clears.

*Alternative considered*: client-generated `new Date().toISOString()` — acceptable but trusts client clocks; a DB-side default is one line and honest.

### D4 — Derived absence

No `absent` rows are written in v1. A child with no attendance row today **is** absent. This avoids prematurely marking late arrivals, requires no end-of-day job, and keeps the `absent`/`late` enum values free for a future reporting change. The counter computes as `count(rows with check_in today for group children) / count(group children)`.

### D5 — Migration: RLS overhaul + audit column + timestamp trigger

One migration (`supabase migration new attendance_rls_and_audit`):

1. `alter table attendance add column recorded_by uuid references auth.users(id) default auth.uid()`.
2. New helper `public.is_staff(uuid)` — SECURITY DEFINER, returns true when `profiles.role in ('teacher','admin')`; mirrors the existing `is_admin(uuid)` definition (stable, `search_path` pinned, execute granted to `authenticated`).
3. `drop policy select_attendance`; create staff-only policies:
   - `staff_select_attendance` FOR SELECT USING `is_staff(auth.uid())`
   - `staff_insert_attendance` FOR INSERT WITH CHECK `is_staff(auth.uid())`
   - `staff_update_attendance` FOR UPDATE USING/WITH CHECK `is_staff(auth.uid())`
   - No DELETE policy (no delete flows in v1). No parent access.
4. Trigger `set_attendance_times`: BEFORE INSERT sets `check_in = now()` when status is `present` and `check_in` is null; BEFORE UPDATE sets nothing automatically — clock-out updates send a sentinel? **No** — simpler: the clock-out query function updates `check_out` with `now()` evaluated in the database via a small `clock_out_children(child_ids uuid[])` RPC. Decision: **use two RPCs** (`clock_in_children`, `clock_out_children`) instead of raw upserts + triggers. Rationale: a single SECURITY-INVOKER SQL function per direction gives server-side `now()`, one round-trip for N children, and keeps `recorded_by = auth.uid()` in one place; RLS still applies. This also matches the project guideline "for complex operations, use database functions via `supabase.rpc()`".
5. Regenerate `src/types/database.types.ts`.

*Alternative considered*: pure client-side `upsert`/`update` calls — workable, but splits timestamp semantics across defaults + triggers and takes two code paths; the RPC pair is smaller and self-documenting.

### D6 — Data layer (query → hook → component)

- `src/queries/attendance/get-group-attendance.ts` — one query returning the group's children (id, name, avatar) joined with today's attendance rows; the component derives both mode lists and the counter from it.
- `src/queries/attendance/clock-in-children.ts` / `clock-out-children.ts` — thin `supabase.rpc()` wrappers.
- Hooks: `UseGroupAttendanceQuery` (key `['group-attendance', groupId, today]`), `UseClockInMutation`, `UseClockOutMutation` (both invalidate `['group-attendance', groupId, today]`).
- Group picker reuses existing `UseGetUserGroupsQuery` / `UseGetAllGroupsQuery` where they fit.

### D7 — UI composition

- `src/components/attendance/` — `AttendanceGroupList` (picker), `AttendanceLog` (log screen client component), `AttendanceChildCard` (selectable wrapper around `EntityAvatarChip` with a selected ring/checkmark), mode toggle via HeroUI `RadioGroup`, sticky full-width HeroUI `Button` for Save.
- Search filters the visible list client-side (accent-insensitive name match), consistent with admin list search.
- All copy under a new `Attendance` namespace in `messages/es.json` via `next-intl`.

### D8 — Feature flag gating on pages

Both attendance pages check `useFeatureFlagEnabled('admin_options_attendance') === true` (plus staff-role check from `userRoleAtom`); when the flag is off/loading or role is parent, render the existing not-found/redirect pattern. This protects deep links; the menu entry gating is untouched.

## Risks / Trade-offs

- **[RLS is table-wide, not group-scoped]** Any teacher can write attendance for any child — this is the product decision, but a compromised teacher account can touch all children's attendance. → Mitigated by `recorded_by` audit column; revisit scoping if roles tighten later.
- **[Timezone: "today"]** `attendance_date` defaults and RPC filters use the database's date while the client computes "today" for query keys; a device in a different timezone near midnight could disagree. → Compute `attendance_date` inside the RPCs only (single source of truth); the client passes no dates.
- **[Clock-out list vs. re-entry]** A child clocked out disappears from both lists (has check_in and check_out) — re-entry the same day is unrepresentable with one row per day. → Accepted for v1; matches the settled model.
- **[Flag loading flash]** `useFeatureFlagEnabled` returns `undefined` while loading, so the page briefly renders the gated state. → Same convention as the plus-button menu (`=== true` treated as off); acceptable.
- **[Derived absence in future reports]** Reports must join against group membership to count absences. → Documented in spec; enum value remains for a future stored model.

## Migration Plan

1. Ship the migration (helper, column, policies, RPCs) — safe before UI exists; nothing reads the table today.
2. Regenerate database types; land data layer + UI behind the existing flag (off by default in production).
3. Enable `admin_options_attendance` in PostHog for internal users → verify → roll out.
4. Rollback: disable the flag (UI disappears); the migration is additive except the dropped broken policy, which granted nothing usable.

## Open Questions

- None — behavior was settled during exploration (any-staff/any-child writes, derived absence, present+absent only, selection clearing, empty-selection save disabled, server-side timestamps).
