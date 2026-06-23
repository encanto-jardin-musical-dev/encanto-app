## MODIFIED Requirements

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
