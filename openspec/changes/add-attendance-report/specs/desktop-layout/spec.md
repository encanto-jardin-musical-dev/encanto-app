## MODIFIED Requirements

### Requirement: Sidebar navigation items are role and feature-flag gated

The sidebar SHALL display navigation items according to the same role and PostHog feature-flag matrix used by the plus button's staff actions, with a single shared source of truth for that gating logic. Feed and Messages SHALL be visible to all roles. Attendance, Attendance Report, Daily Report, and Tasks SHALL be visible to staff roles only and each SHALL be hidden when its dedicated flag (`admin_options_attendance`, `admin_options_attendance_report`, `admin_options_reports`, `admin_options_tasks`) is disabled or still loading (`undefined`). The Admin item SHALL be visible only to admins.

#### Scenario: Admin sidebar shows all enabled sections
- **WHEN** an admin views the sidebar and all per-action flags are enabled
- **THEN** the sidebar shows Feed, Messages, Attendance, Attendance Report, Daily Report, Tasks, and Admin items

#### Scenario: Teacher sidebar excludes Admin
- **WHEN** a teacher views the sidebar and all per-action flags are enabled
- **THEN** the sidebar shows Feed, Messages, Attendance, Attendance Report, Daily Report, and Tasks
- **AND** the sidebar does NOT show an Admin item

#### Scenario: Parent sidebar shows only Feed and Messages
- **WHEN** a parent views the sidebar
- **THEN** the sidebar shows only Feed and Messages items

#### Scenario: Disabled or loading flag hides its sidebar item
- **WHEN** a staff user views the sidebar and `admin_options_tasks` is disabled or still loading
- **THEN** the Tasks item is not shown in the sidebar

#### Scenario: Attendance Report flag disabled hides its sidebar item
- **WHEN** a staff user views the sidebar and `admin_options_attendance_report` is disabled or still loading
- **THEN** the Attendance Report item is not shown in the sidebar

#### Scenario: Selecting a sidebar item navigates to its route
- **WHEN** a user selects a sidebar item
- **THEN** the system navigates to that item's route
