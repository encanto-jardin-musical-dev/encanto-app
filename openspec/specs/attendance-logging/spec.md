# attendance-logging

## Purpose
Staff-only (teacher/admin) daily attendance logging: a role-scoped group picker and a per-group log screen for recording today's clock-ins and clock-outs in bulk, gated behind a feature flag.

## Requirements

### Requirement: Attendance pages are gated by feature flag and staff role

The attendance group picker (`/attendance`) and attendance log (`/attendance/[groupId]`) pages SHALL render their content only when the PostHog feature flag `admin_options_attendance` evaluates to `true` AND the current user's role is teacher or admin. A flag value of `false` or `undefined` (still loading) SHALL be treated as disabled.

#### Scenario: Staff user with flag enabled

- **WHEN** a teacher or admin with `admin_options_attendance` enabled navigates to `/attendance`
- **THEN** the group picker renders

#### Scenario: Deep link with flag disabled

- **WHEN** any user navigates directly to `/attendance/[groupId]` while `admin_options_attendance` is disabled or still loading
- **THEN** the attendance content does not render and the user sees the app's not-found/redirect treatment

#### Scenario: Parent deep link

- **WHEN** a parent navigates to `/attendance` or `/attendance/[groupId]` even with the flag enabled
- **THEN** the attendance content does not render

### Requirement: Group picker scoped by role

The `/attendance` page SHALL list groups for the user to choose from: a teacher SHALL see only the groups they are assigned to via `group_teachers`; an admin SHALL see all groups and SHALL be able to filter the list by teacher. Selecting a group SHALL navigate to `/attendance/[groupId]`.

#### Scenario: Teacher sees own groups

- **WHEN** a teacher assigned to two groups opens `/attendance`
- **THEN** exactly those two groups are listed

#### Scenario: Admin filters by teacher

- **WHEN** an admin opens `/attendance` and selects a teacher in the filter
- **THEN** the list shows only groups assigned to that teacher

#### Scenario: Group navigation

- **WHEN** the user taps a group in the picker
- **THEN** the app navigates to `/attendance/[groupId]` for that group

### Requirement: Attendance log operates on today only

The attendance log screen SHALL read and write attendance exclusively for the current date. The date used for reads and writes SHALL be determined by the database, not the client.

#### Scenario: No historical editing

- **WHEN** the attendance log screen loads for a group
- **THEN** only today's attendance rows influence the lists and counter

### Requirement: Clock-in mode lists children without a check-in today

In clock-in mode the log screen SHALL list only the group's children that have no check-in recorded today (the derived-absent set). Each child SHALL be rendered as an avatar card with the child's name.

#### Scenario: Partially clocked-in group

- **WHEN** 12 of a group's 20 children already have a check-in today and the user selects clock-in mode
- **THEN** only the 8 children without a check-in are listed

#### Scenario: Late arrival remains listed

- **WHEN** a child was not clocked in during an earlier save
- **THEN** that child continues to appear in the clock-in list until they are clocked in

### Requirement: Clock-out mode lists children clocked in but not out

In clock-out mode the log screen SHALL list only the group's children that have a check-in today and no check-out today.

#### Scenario: Clock-out candidates

- **WHEN** a group has children with check-in only, children with check-in and check-out, and children with no row today, and the user selects clock-out mode
- **THEN** only the children with a check-in and no check-out are listed

### Requirement: Multi-select with staged state

Tapping a child card SHALL toggle its selected state with a visible selection indicator. Selection SHALL be client-side only — no attendance data SHALL be written until Save is tapped. Switching between clock-in and clock-out modes SHALL clear the selection.

#### Scenario: Toggle selection

- **WHEN** the user taps an unselected child card and then taps it again
- **THEN** the card becomes selected and then unselected, with no database writes

#### Scenario: Mode switch clears selection

- **WHEN** the user has three children selected in clock-in mode and switches to clock-out mode
- **THEN** the selection is empty

### Requirement: Bulk save with server-side timestamps

Tapping Save SHALL apply the current mode's action to all selected children in a single bulk operation. The Save button SHALL be disabled when the selection is empty. In clock-in mode the system SHALL record one attendance row per selected child for today with status `present` and a database-generated `check_in` timestamp, upserting on `(child_id, attendance_date)` so re-clocking a child does not create a duplicate row. In clock-out mode the system SHALL set a database-generated `check_out` timestamp on today's row for each selected child. Each write SHALL record the authenticated user in `recorded_by`. After a successful save the lists SHALL refresh and the selection SHALL clear.

#### Scenario: Bulk clock-in

- **WHEN** the user selects five children in clock-in mode and taps Save
- **THEN** five rows exist for today with status `present`, a database-set check-in time, and `recorded_by` set to the saving user, and the five children disappear from the clock-in list

#### Scenario: Bulk clock-out

- **WHEN** the user selects three clocked-in children in clock-out mode and taps Save
- **THEN** those children's rows for today have a database-set check-out time and the children disappear from the clock-out list

#### Scenario: Empty selection

- **WHEN** no children are selected
- **THEN** the Save button is disabled

### Requirement: Present counter

The log screen SHALL display a counter of the number of the group's children with a check-in today over the total number of children in the group, updating after each successful save.

#### Scenario: Counter after save

- **WHEN** a 20-child group has 10 children checked in and the user clocks in 2 more
- **THEN** the counter shows 12/20

### Requirement: Search filters the visible list

The log screen SHALL provide a search input that filters the currently visible child list by name on the client. Clearing the search SHALL restore the full list for the active mode.

#### Scenario: Name filter

- **WHEN** the user types a partial child name in the search input
- **THEN** only matching children in the active mode's list remain visible

### Requirement: Derived absence

The system SHALL treat a child with no attendance row today as absent. The system SHALL NOT write rows with status `absent`, and SHALL NOT use the `late` status.

#### Scenario: No absent rows written

- **WHEN** a clock-in save completes with some of the group's children unselected
- **THEN** no attendance rows exist for the unselected children for today

### Requirement: Staff-only database access

The `attendance` table SHALL be readable and writable (SELECT, INSERT, UPDATE) by authenticated users whose profile role is teacher or admin, for any child. Parents SHALL have no access. The previous SELECT policy comparing `child_id` to the authenticated user id SHALL be removed. Row deletion SHALL NOT be granted.

#### Scenario: Teacher writes any child

- **WHEN** a teacher records attendance for a child outside their assigned groups
- **THEN** the write succeeds

#### Scenario: Parent denied

- **WHEN** a parent queries the `attendance` table
- **THEN** no rows are returned and writes are rejected

### Requirement: Localized copy

All user-facing text on the attendance pages SHALL come from the `messages/es.json` catalog via `next-intl`; no copy SHALL be hardcoded in components.

#### Scenario: Spanish catalog

- **WHEN** the attendance pages render
- **THEN** every label (modes, counter, save, search placeholder, empty states) resolves from the `es.json` catalog
