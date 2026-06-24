# group-teachers

## Purpose
Many-to-many association between groups and teachers, replacing the legacy single-teacher-per-group model, with admin-managed assignment and admin-only write access enforced via RLS.

## Requirements

### Requirement: A group can have multiple teachers
The system SHALL associate groups and teachers through a many-to-many `group_teachers` join table, replacing the single `groups.teacher_id` column. A group SHALL be allowed to have zero, one, or many teachers.

#### Scenario: Multiple teachers assigned to one group
- **WHEN** an admin assigns two or more teachers to a group
- **THEN** the system stores one `group_teachers` row per teacher and the group is associated with all of them

#### Scenario: Group with no teacher
- **WHEN** a group has no teachers assigned
- **THEN** the system stores no `group_teachers` rows for that group and the group remains valid

#### Scenario: Each teacher linked at most once per group
- **WHEN** the same teacher is assigned to the same group
- **THEN** the system stores only a single `group_teachers` row for that pair (uniqueness on group + teacher)

### Requirement: Existing single-teacher assignments are preserved
The system SHALL migrate every existing `groups.teacher_id` value into the `group_teachers` table before the column is removed, so no current teacher assignment is lost.

#### Scenario: Backfill on migration
- **WHEN** the migration runs against a database where some groups have a `teacher_id`
- **THEN** each such group gains a matching `group_teachers` row and the `groups.teacher_id` column is dropped afterward

### Requirement: Teacher group membership reflects the join table
The system SHALL resolve the set of groups a teacher belongs to from the `group_teachers` table.

#### Scenario: Teacher sees their groups in the feed
- **WHEN** the app loads groups for a teacher who is linked to one or more groups via `group_teachers`
- **THEN** the system returns exactly those groups, and the teacher feed hydration behaves as before

#### Scenario: Teacher with no group links
- **WHEN** a teacher has no `group_teachers` rows
- **THEN** the system returns an empty set of groups for that teacher

### Requirement: Admin can assign multiple teachers when creating or editing a group
The system SHALL let an admin select a set of teachers when creating or editing a group, and SHALL reconcile the group's teacher links to match the selection.

#### Scenario: Creating a group with several teachers
- **WHEN** an admin creates a group and selects multiple teachers
- **THEN** the system creates the group and a `group_teachers` link for each selected teacher

#### Scenario: Adding and removing teachers on edit
- **WHEN** an admin edits a group's teacher selection, adding some teachers and removing others
- **THEN** the system inserts links for newly selected teachers and deletes links for de-selected teachers, leaving unchanged ones intact

#### Scenario: Clearing all teachers
- **WHEN** an admin removes every teacher from a group and saves
- **THEN** the system deletes all `group_teachers` rows for that group

### Requirement: Group detail shows all assigned teachers
The system SHALL display every teacher assigned to a group on the group detail screen.

#### Scenario: Detail lists multiple teachers
- **WHEN** an admin opens the detail of a group with multiple teachers
- **THEN** the system displays each assigned teacher

#### Scenario: Detail with no teachers
- **WHEN** an admin opens the detail of a group with no teachers
- **THEN** the system indicates there are no teachers assigned, without error

### Requirement: Teacher assignment writes are admin-only
The system SHALL enforce that only authenticated admins can create or delete `group_teachers` rows, while authenticated users may read them.

#### Scenario: Admin manages teacher links
- **WHEN** an admin inserts or deletes a `group_teachers` row
- **THEN** the operation is permitted by RLS

#### Scenario: Non-admin write attempt
- **WHEN** a non-admin attempts to insert or delete a `group_teachers` row
- **THEN** the database rejects the write via RLS
