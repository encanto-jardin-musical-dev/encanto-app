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

When the feature flag is enabled, a user whose role is teacher or admin SHALL see the plus button expand into a menu of actions. Teachers SHALL see four actions: Attendance, Daily Report, Tasks, and Messages. Admins SHALL see those four actions plus an Admin Options action. The Admin Options action SHALL be visible only to admins. Each action's label SHALL be resolved from the i18n message catalog by the action's stable key, not from a hardcoded literal.

#### Scenario: Teacher expands the plus button
- **WHEN** a teacher with the flag enabled taps the plus button
- **THEN** the system reveals a menu with Attendance, Daily Report, Tasks, and Messages actions, each with an icon and a localized label from the catalog
- **AND** the menu does NOT include an Admin Options action

#### Scenario: Admin expands the plus button
- **WHEN** an admin with the flag enabled taps the plus button
- **THEN** the system reveals a menu with Attendance, Daily Report, Tasks, Messages, and Admin Options actions, each with an icon and a localized label from the catalog

#### Scenario: Selecting an action navigates to its screen
- **WHEN** a staff user selects one of the sub-options
- **THEN** the system navigates to the corresponding screen for that action

### Requirement: Parent users create new messages directly

When the feature flag is enabled, a user whose role is parent SHALL NOT see a sub-options menu. The plus button SHALL navigate the parent directly to create a new message.

#### Scenario: Parent taps the plus button
- **WHEN** a parent with the flag enabled taps the plus button
- **THEN** the system navigates directly to create a new message without showing a sub-options menu

### Requirement: Placeholder screens for new staff actions

The system SHALL provide a navigable screen for each new staff action that has no existing destination — Attendance, Daily Report, Tasks, and Admin Options. Each placeholder screen SHALL display only its screen name, sourced from the i18n message catalog so it matches the corresponding menu label, except the Admin Options destination which is a full dashboard at `/admin`. The Messages action SHALL reuse the existing messages screen.

#### Scenario: Navigating to the Attendance screen
- **WHEN** a staff user selects the Attendance action
- **THEN** the system displays a screen showing the localized Attendance name from the catalog

#### Scenario: Navigating to the Daily Report screen
- **WHEN** a staff user selects the Daily Report action
- **THEN** the system displays a screen showing the localized Daily Report name from the catalog

#### Scenario: Navigating to the Tasks screen
- **WHEN** a staff user selects the Tasks action
- **THEN** the system displays a screen showing the localized Tasks name from the catalog

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

