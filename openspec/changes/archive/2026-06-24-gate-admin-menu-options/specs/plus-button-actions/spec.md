## MODIFIED Requirements

### Requirement: Staff users see expandable sub-options

When the menu-level feature flag is enabled, a user whose role is teacher or admin SHALL see the plus button expand into a menu of actions. The Attendance, Daily Report, and Tasks actions SHALL each be individually gated behind a dedicated PostHog feature flag and SHALL appear only when their flag evaluates to `true`:

- Attendance is gated behind `admin_options_attendance`.
- Daily Report is gated behind `admin_options_reports`.
- Tasks is gated behind `admin_options_tasks`.

When a per-action flag is disabled or its value is still loading (`undefined`), that action SHALL be hidden from the menu. The Messages action SHALL always be visible to staff and SHALL NOT be gated by these flags. The Admin Options action SHALL be visible only to admins and SHALL NOT be gated by these flags. Each visible action's label SHALL be resolved from the i18n message catalog by the action's stable key, not from a hardcoded literal.

#### Scenario: Teacher sees only flag-enabled actions
- **WHEN** a teacher with the menu flag enabled taps the plus button, and `admin_options_attendance`, `admin_options_reports`, and `admin_options_tasks` are all enabled
- **THEN** the system reveals a menu with Attendance, Daily Report, Tasks, and Messages actions, each with an icon and a localized label from the catalog
- **AND** the menu does NOT include an Admin Options action

#### Scenario: Admin sees only flag-enabled actions
- **WHEN** an admin with the menu flag enabled taps the plus button, and `admin_options_attendance`, `admin_options_reports`, and `admin_options_tasks` are all enabled
- **THEN** the system reveals a menu with Attendance, Daily Report, Tasks, Messages, and Admin Options actions, each with an icon and a localized label from the catalog

#### Scenario: A disabled per-action flag hides its action
- **WHEN** a staff user with the menu flag enabled taps the plus button, and `admin_options_tasks` is disabled while `admin_options_attendance` and `admin_options_reports` are enabled
- **THEN** the menu shows Attendance and Daily Report
- **AND** the menu does NOT show the Tasks action

#### Scenario: A loading per-action flag hides its action
- **WHEN** a staff user with the menu flag enabled taps the plus button, and `admin_options_attendance` is still loading (its value is `undefined`)
- **THEN** the Attendance action is treated as disabled and is hidden from the menu

#### Scenario: Messages and Admin Options are not gated by per-action flags
- **WHEN** a staff user with the menu flag enabled taps the plus button, and all of `admin_options_attendance`, `admin_options_reports`, and `admin_options_tasks` are disabled
- **THEN** the Messages action is still shown to the staff user
- **AND** the Admin Options action is still shown when the user is an admin

#### Scenario: Selecting an action navigates to its screen
- **WHEN** a staff user selects one of the visible sub-options
- **THEN** the system navigates to the corresponding screen for that action
