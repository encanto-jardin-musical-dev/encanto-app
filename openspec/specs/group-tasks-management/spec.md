# group-tasks-management

## Purpose

Staff (teacher/admin) creation, listing, search, editing, and deletion of tasks scoped to groups, including database-level access rules (RLS) for the `tasks` table.

## Requirements

### Requirement: Staff task list

The system SHALL provide a task list screen at `/tasks` for staff users (teacher or admin), gated behind the `admin_options_tasks` feature flag and staff roles. The list SHALL show the tasks of every group the user manages — a teacher's assigned groups, or all groups for an admin — ordered by creation date descending. Each list item SHALL display the task title, its creation date, and its due date, and SHALL expose a per-item actions menu. The screen SHALL provide a search input that filters the visible list by task title.

#### Scenario: Teacher sees tasks for assigned groups only
- **WHEN** a teacher with the `admin_options_tasks` flag enabled opens `/tasks`
- **THEN** the system lists tasks belonging to the teacher's assigned groups, newest first
- **AND** tasks of groups the teacher is not assigned to are not listed

#### Scenario: Admin sees tasks for all groups
- **WHEN** an admin with the flag enabled opens `/tasks`
- **THEN** the system lists tasks across all groups, newest first

#### Scenario: Search filters by title
- **WHEN** a staff user types text into the search input
- **THEN** the list shows only tasks whose title matches the typed text
- **AND** clearing the search restores the full list

#### Scenario: Non-staff or flag off is bounced
- **WHEN** a parent, or any user with the `admin_options_tasks` flag disabled, navigates to `/tasks`
- **THEN** the system renders the not-found page

### Requirement: Task creation

The system SHALL provide a task creation screen at `/tasks/new` for staff users, gated behind the `admin_options_tasks` feature flag. The form SHALL collect a required title, a target group, an optional due date, an optional description with a visible character counter, and optional file attachments. The group selector SHALL offer only the groups the user manages — a teacher's assigned groups, or all groups for an admin. On successful submission the system SHALL persist the task with the creating user recorded as its author and return the user to the task list.

#### Scenario: Teacher creates a task for an assigned group
- **WHEN** a teacher fills in a title, selects one of their assigned groups, and submits
- **THEN** the task is persisted for that group with the teacher recorded as author
- **AND** the user is returned to the task list where the new task appears

#### Scenario: Group options are scoped by role
- **WHEN** a teacher opens the create form
- **THEN** the group selector lists only that teacher's assigned groups
- **WHEN** an admin opens the create form
- **THEN** the group selector lists all groups

#### Scenario: Title is required
- **WHEN** a staff user submits the form without a title
- **THEN** the system shows a validation message and does not persist a task

#### Scenario: Attachments are uploaded with the task
- **WHEN** a staff user adds files via "Add files" and submits
- **THEN** the files are uploaded through the existing attachment upload flow
- **AND** the persisted task references the uploaded attachments

### Requirement: Task editing and deletion

The system SHALL allow staff users to edit and delete tasks from the task list's per-item actions menu. Teachers SHALL only be able to edit or delete tasks belonging to their assigned groups; admins SHALL be able to edit or delete any task. Editing SHALL reuse the same form as creation, pre-populated with the task's current values. Deletion SHALL require an explicit confirmation before the task is removed.

#### Scenario: Staff edits a task
- **WHEN** a staff user chooses "edit" on a task and changes its fields
- **THEN** the updated values are persisted and reflected in the list

#### Scenario: Staff deletes a task after confirmation
- **WHEN** a staff user chooses "delete" on a task and confirms
- **THEN** the task is removed and no longer appears in any list or feed

#### Scenario: Delete without confirmation does nothing
- **WHEN** a staff user chooses "delete" but dismisses the confirmation
- **THEN** the task remains unchanged

### Requirement: Task detail view

The system SHALL provide a task detail screen at `/tasks/[groupId]/[taskId]`, gated behind the `admin_options_tasks` feature flag, accessible to staff and to parents. The detail SHALL display the task title, group name, creation and due dates, description, and attachments (with signed URLs resolved through the existing attachment signing flow). Staff users SHALL see edit and delete actions on the detail; parents SHALL see a read-only view.

#### Scenario: Staff opens a task detail
- **WHEN** a staff user opens a task's detail
- **THEN** the full task content is displayed together with edit and delete actions

#### Scenario: Unknown task id
- **WHEN** a user navigates to a task detail whose id does not exist or is not visible to them
- **THEN** the system renders the not-found page

### Requirement: Tasks table access rules

The `tasks` table SHALL enforce row-level security aligned with the UI rules: the open read-for-everyone policy SHALL be removed. Reading a task SHALL require the requester to be staff, or to be a guardian of a child that belongs to the task's group. Creating, updating, or deleting a task SHALL require the requester to be an admin, or a teacher assigned to the task's group. On insert, the task's author (`teacher_id`) SHALL be the authenticated user.

#### Scenario: Guardian reads own-group tasks only
- **WHEN** a parent queries tasks
- **THEN** only tasks whose group contains one of their children are returned

#### Scenario: Teacher cannot write to an unassigned group
- **WHEN** a teacher attempts to insert, update, or delete a task for a group they are not assigned to
- **THEN** the database rejects the operation

#### Scenario: Authorship cannot be forged
- **WHEN** a task insert specifies a `teacher_id` different from the authenticated user
- **THEN** the database rejects the insert

#### Scenario: Anonymous access is denied
- **WHEN** an unauthenticated request queries the tasks table
- **THEN** no rows are returned
