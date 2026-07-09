## MODIFIED Requirements

### Requirement: Staff report list

The system SHALL provide a report list screen at `/reports` for staff users (teacher or admin), gated behind the `admin_options_reports` feature flag and staff roles. The list SHALL show the reports of every group the user manages — a teacher's assigned groups, or all groups for an admin — ordered by creation date descending within each group. Each list item SHALL display the report title, its creation date, and, when the report targets a specific child rather than the whole group, the child's full name. The screen SHALL provide a search input that filters the visible list by report title, and a floating action button that navigates to the report creation screen. For admin users, the list SHALL be grouped by group, with each group's reports shown under a header bearing the group's name, groups ordered alphabetically; teachers, who manage at most their own assigned groups, see a single flat list.

#### Scenario: Teacher sees reports for assigned groups only
- **WHEN** a teacher with the `admin_options_reports` flag enabled opens `/reports`
- **THEN** the system lists reports belonging to the teacher's assigned groups, newest first, without group headers

#### Scenario: Admin sees reports grouped by group
- **WHEN** an admin with the flag enabled opens `/reports`
- **THEN** the system lists reports across all groups, grouped under a header per group in alphabetical order by group name
- **AND** within each group's section, reports are ordered newest first

#### Scenario: Individual report shows the target child's name
- **WHEN** a staff user views the report list and a report targets a specific child
- **THEN** the list item shows the child's full name below the title, secondary to the title in size and weight
- **AND** group-wide reports show no child name

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
