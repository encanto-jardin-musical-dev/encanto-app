# plus-button-actions

## Purpose

Defines the role-aware, feature-flagged behavior of the plus button, including expandable sub-options for staff users, direct message creation for parents, placeholder destinations for new staff actions, and alignment with the app's design system.
## Requirements
### Requirement: Feature-flagged plus button behavior

The plus button SHALL gate its sub-options behavior behind a PostHog feature flag. When the flag is disabled or its value is still loading (`undefined`), the plus button SHALL fall back to its current behavior of navigating directly to the messages screen for all roles.

#### Scenario: Flag disabled falls back to messages
- **WHEN** the feature flag is disabled and any user taps the plus button
- **THEN** the system navigates directly to the messages screen without showing a sub-options menu

#### Scenario: Flag still loading falls back to messages
- **WHEN** the feature flag value is undefined (still loading) and a user taps the plus button
- **THEN** the system treats the flag as off and navigates directly to the messages screen

#### Scenario: Flag enabled activates role-aware behavior
- **WHEN** the feature flag is enabled
- **THEN** the plus button applies role-aware behavior as defined by the staff and parent requirements

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

### Requirement: Parent users create new messages directly

When the feature flag is enabled, a user whose role is parent SHALL NOT see a sub-options menu. The plus button SHALL navigate the parent directly to create a new message.

#### Scenario: Parent taps the plus button
- **WHEN** a parent with the flag enabled taps the plus button
- **THEN** the system navigates directly to create a new message without showing a sub-options menu

### Requirement: Placeholder screens for new staff actions

The system SHALL provide a navigable screen for each new staff action that has no existing destination — Attendance and Admin Options. Each placeholder screen SHALL display only its screen name, sourced from the i18n message catalog so it matches the corresponding menu label, except the Admin Options destination which is a full dashboard at `/admin`. The Messages action SHALL reuse the existing messages screen. The Tasks action SHALL navigate to the tasks list screen at `/tasks` (defined by the `group-tasks-management` capability) and SHALL no longer be a placeholder. The Daily Report action SHALL navigate to the reports list screen at `/reports` (defined by the `group-reports-management` capability) and SHALL no longer be a placeholder.

#### Scenario: Navigating to the Attendance screen
- **WHEN** a staff user selects the Attendance action
- **THEN** the system displays a screen showing the localized Attendance name from the catalog

#### Scenario: Navigating to the Daily Report screen
- **WHEN** a staff user selects the Daily Report action
- **THEN** the system navigates to the reports list screen at `/reports`

#### Scenario: Navigating to the Tasks screen
- **WHEN** a staff user selects the Tasks action
- **THEN** the system navigates to the tasks list screen at `/tasks`

#### Scenario: Navigating to the Admin Options screen
- **WHEN** a staff user (admin) selects the Admin Options action
- **THEN** the system navigates to the admin dashboard at `/admin`

#### Scenario: Navigating to Messages reuses the existing screen
- **WHEN** a staff user selects the Messages action
- **THEN** the system navigates to the existing messages screen

### Requirement: Design system alignment

The plus button and its sub-options SHALL be built with the app's existing HeroUI components and Heroicons, using established conventions (icon-only buttons with accessible labels and `onPress` handlers). Accessible labels SHALL be sourced from the i18n message catalog, consistent with the rest of the app.

#### Scenario: Sub-options use design-system components
- **WHEN** the sub-options menu is rendered
- **THEN** it uses HeroUI components and Heroicons consistent with the rest of the app, and each interactive control has an accessible label sourced from the i18n catalog

### Requirement: Localized text source for plus button labels

All user-facing text rendered by the plus button — the trigger's accessible label and every sub-option label — SHALL be sourced from the app's i18n message catalog (`next-intl`) rather than hardcoded literals. Each sub-option label SHALL be resolved by the action's stable `key` against a dedicated message namespace, so each label has a single source of truth.

#### Scenario: Sub-option labels come from the message catalog
- **WHEN** the sub-options menu is rendered for a staff user
- **THEN** each action label is read from the i18n catalog keyed by the action's stable key
- **AND** no action label is a hardcoded literal in the component

#### Scenario: Trigger accessible label comes from the message catalog
- **WHEN** the plus button trigger is rendered
- **THEN** its accessible label is read from the i18n catalog rather than a hardcoded literal

#### Scenario: Locale determines displayed text
- **WHEN** the active locale resolves to Spanish
- **THEN** the menu labels and trigger label display their Spanish translations from the catalog

