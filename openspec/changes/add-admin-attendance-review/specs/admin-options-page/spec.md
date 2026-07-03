# Delta Spec: admin-options-page

## MODIFIED Requirements

### Requirement: Entity creation shortcuts

The Admin Options screen SHALL present a "Create or edit new items" section containing five shortcut tiles — Groups, Children, Teachers, Parents, and Asistencia — each rendered with an icon and a localized label. Selecting a tile SHALL navigate the user to that entity's destination under the `/admin` route namespace (e.g., `/admin/children`); the Asistencia tile SHALL navigate to `/admin/attendance`.

#### Scenario: Shortcut tiles are displayed

- **WHEN** the Admin Options screen is rendered
- **THEN** the system displays a localized section header and five tiles labeled Groups, Children, Teachers, Parents, and Asistencia, each with an icon

#### Scenario: Selecting a shortcut tile navigates

- **WHEN** the user selects one of the shortcut tiles
- **THEN** the system navigates to that entity's destination under `/admin` (e.g., the Children tile navigates to `/admin/children`)

#### Scenario: Selecting the Asistencia tile navigates to the attendance overview

- **WHEN** the user selects the Asistencia tile
- **THEN** the system navigates to `/admin/attendance`

### Requirement: Localized text source for Admin Options

All user-facing text on the Admin Options screen — the page title, the shortcut section header, every tile label (including the Asistencia tile), the Total of Kids label, the Today assistance header, and the assistance metric labels — SHALL be sourced from the app's i18n message catalog (`next-intl`) rather than hardcoded literals.

#### Scenario: All labels come from the message catalog

- **WHEN** the Admin Options screen is rendered
- **THEN** every header and label — including the Asistencia tile label — is read from the i18n catalog
- **AND** no header or label is a hardcoded literal in the components

#### Scenario: Locale determines displayed text

- **WHEN** the active locale resolves to Spanish
- **THEN** the screen's titles and labels display their Spanish translations from the catalog

## ADDED Requirements

### Requirement: Today assistance counter links to the attendance overview

The "Today assistance" summary counter on the Admin Options screen SHALL be an interactive navigation control that, when activated, navigates the user to `/admin/attendance`. Activating the counter SHALL NOT mutate any attendance data. The navigation destination SHALL match the Asistencia shortcut tile.

#### Scenario: Tapping the counter opens the attendance overview

- **WHEN** an admin taps the Today assistance counter on the Admin Options screen
- **THEN** the system navigates to `/admin/attendance`

#### Scenario: Tapping the counter performs no write

- **WHEN** an admin taps the Today assistance counter
- **THEN** no attendance record is created or modified as a result of the navigation

#### Scenario: Counter and tile share a destination

- **WHEN** the Admin Options screen is rendered
- **THEN** both the Today assistance counter and the Asistencia tile navigate to `/admin/attendance`
