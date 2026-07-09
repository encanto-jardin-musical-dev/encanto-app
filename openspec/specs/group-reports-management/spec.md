# group-reports-management

## Purpose

Staff creation, listing, and search of reports scoped to groups or attendance-verified single children, including `daily_reports` schema changes and RLS.

## Requirements

### Requirement: Staff report list

The system SHALL provide a report list screen at `/reports` for staff users (teacher or admin), gated behind the `admin_options_reports` feature flag and staff roles. The list SHALL show the reports of every group the user manages — a teacher's assigned groups, or all groups for an admin — ordered by creation date descending within each group. Each list item SHALL display the report title and its creation date. The screen SHALL provide a search input that filters the visible list by report title, and a floating action button that navigates to the report creation screen. For admin users, the list SHALL be grouped by group, with each group's reports shown under a header bearing the group's name, groups ordered alphabetically; teachers, who manage at most their own assigned groups, see a single flat list.

#### Scenario: Teacher sees reports for assigned groups only
- **WHEN** a teacher with the `admin_options_reports` flag enabled opens `/reports`
- **THEN** the system lists reports belonging to the teacher's assigned groups, newest first, without group headers

#### Scenario: Admin sees reports grouped by group
- **WHEN** an admin with the flag enabled opens `/reports`
- **THEN** the system lists reports across all groups, grouped under a header per group in alphabetical order by group name
- **AND** within each group's section, reports are ordered newest first

#### Scenario: Search filters by title within groups
- **WHEN** an admin types text into the search input
- **THEN** each group section shows only its reports whose title matches the typed text
- **AND** groups with no matching reports are not shown

#### Scenario: Search filters by title
- **WHEN** a staff user types text into the search input
- **THEN** the list shows only reports whose title matches the typed text
- **AND** clearing the search restores the full list

#### Scenario: FAB navigates to creation
- **WHEN** a staff user taps the floating action button
- **THEN** the system navigates to `/reports/new`

#### Scenario: Non-staff or flag off is bounced
- **WHEN** a parent, or any user with the `admin_options_reports` flag disabled, navigates to `/reports`
- **THEN** the system renders the not-found page

### Requirement: Report creation

The system SHALL provide a report creation screen at `/reports/new` for staff users, gated behind the `admin_options_reports` feature flag. The form SHALL collect a target group, a child target, a required title, an optional description with a visible character counter, and optional file attachments. The group selector SHALL offer only the groups the user manages — a teacher's assigned groups, or all groups for an admin. The child selector SHALL offer a default "send to all" option (a group-wide report) plus only the children of the selected group who have attendance recorded as present or late for the report date. On successful submission the system SHALL persist the report with the creating user recorded as its author, the report date set to the current date, and the selected child (or none for group-wide), then return the user to the report list.

#### Scenario: Teacher creates a group-wide report
- **WHEN** a teacher selects one of their assigned groups, keeps the "send to all" child option, fills in a title, and submits
- **THEN** the report is persisted for that group with no child target and the teacher recorded as author
- **AND** the user is returned to the report list where the new report appears

#### Scenario: Teacher creates a single-child report
- **WHEN** a teacher selects a group and one of the attendance-verified children, fills in a title, and submits
- **THEN** the report is persisted for that group targeted at that child

#### Scenario: Child options are limited to attendant children
- **WHEN** a staff user opens the child selector for a group
- **THEN** the options are the "send to all" option and only the children of that group with a present or late attendance record for the report date
- **AND** children without attendance that day are not offered

#### Scenario: Group options are scoped by role
- **WHEN** a teacher opens the create form
- **THEN** the group selector lists only that teacher's assigned groups
- **WHEN** an admin opens the create form
- **THEN** the group selector lists all groups

#### Scenario: Title is required
- **WHEN** a staff user submits the form without a title
- **THEN** the system shows a validation message and does not persist a report

### Requirement: Report attachments

Report attachments SHALL follow the same constraints as message attachments: at most 4 files per report, each at most 10 MB, restricted to JPEG, PNG, WEBP, and PDF types, validated client-side before upload and uploaded through the existing signed-URL flow. The stored attachment metadata SHALL preserve the order in which files were attached.

#### Scenario: Attachments are uploaded with the report
- **WHEN** a staff user attaches valid files and submits the report
- **THEN** the files are uploaded via the signed-URL flow and their metadata persisted with the report in the attached order

#### Scenario: Attachment limits enforced
- **WHEN** a staff user tries to attach more than 4 files, a file over 10 MB, or an unsupported type
- **THEN** the system shows a validation error and does not upload the offending files

### Requirement: Reports database access rules

The `daily_reports` table SHALL store a group reference, an optional child reference (empty meaning group-wide), an author reference, a title, an optional description, attachment metadata, and a report date, with row level security enabled. SELECT SHALL be allowed for staff, and for guardians linked to the report's group — except that when a report targets a single child, only that child's guardians (besides staff) may read it. INSERT SHALL require the author to be the authenticated user and the user to be an admin or a teacher assigned to the report's group. UPDATE and DELETE SHALL be allowed for admins and teachers assigned to the report's group.

#### Scenario: Guardian reads group-wide report
- **WHEN** a guardian of a child in the report's group queries a report with no child target
- **THEN** the row is returned

#### Scenario: Guardian cannot read another child's individual report
- **WHEN** a guardian queries a report targeted at a child they are not a guardian of, even within their child's group
- **THEN** the row is not returned

#### Scenario: Unassigned teacher cannot create a report for a group
- **WHEN** a teacher not assigned to a group attempts to insert a report for that group
- **THEN** the insert is rejected by row level security

#### Scenario: Authorship cannot be forged
- **WHEN** a staff user attempts to insert a report with an author other than themselves
- **THEN** the insert is rejected by row level security
