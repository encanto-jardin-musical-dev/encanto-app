# admin-options-page

## Purpose

Defines the Admin Options dashboard screen — a role-appropriate landing page for admins with entity creation/editing shortcuts (Groups, Children, Teachers, Parents, and Asistencia) and a summary panel (Total of Kids from real data; Today assistance with a single live Jardín metric), with all copy localized via i18n.

## Requirements

### Requirement: Admin Options dashboard layout

The Admin Options screen (`/admin`) SHALL render a dashboard composed of a back navigation bar, a localized page title, an entity-shortcut section, and a summary panel, matching the approved wireframe. The screen SHALL retain a back action that returns the user to the feed.

#### Scenario: Admin opens the Admin Options screen
- **WHEN** a user navigates to `/admin`
- **THEN** the system displays a navigation bar with a back action to the feed, the localized page title, an entity-shortcut section, and a summary panel

#### Scenario: Navigating back from Admin Options
- **WHEN** the user activates the back action on the Admin Options screen
- **THEN** the system navigates to the feed screen

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

### Requirement: Total of Kids from real data

The Admin Options screen SHALL display the Total of Kids as a single numeric value derived from the count of records in the `children` data source. The count SHALL be obtained without transferring the full set of child records (e.g., a count-only query), and the screen SHALL handle the loading state gracefully before the count resolves.

#### Scenario: Total of Kids reflects the children count
- **WHEN** the summary panel is rendered and the children count has resolved
- **THEN** the system displays a localized "Total of Kids" label and the numeric count of records in the `children` data source

#### Scenario: Loading state before the count resolves
- **WHEN** the summary panel is rendered and the children count has not yet resolved
- **THEN** the system displays a non-error placeholder in place of the value rather than crashing or showing a hardcoded number

### Requirement: Today assistance with live data

The Admin Options screen SHALL display a "Today assistance" block with a single metric — Jardín (child care) — presented as a `current/total` value sourced from live data: `current` SHALL be the number of children currently present (checked-in and not checked-out) for today in the `attendance` data source, and `total` SHALL be the same children count used by the Total of Kids figure. "Today" SHALL be the school's local calendar day (America/Bogota), matching the attendance logging feature's day boundary. The current-count SHALL be obtained without transferring attendance rows (a count-only query), and the block SHALL display a non-error placeholder while either value is unresolved. The Workshops metric SHALL NOT be displayed.

#### Scenario: Jardín metric reflects live attendance
- **WHEN** the summary panel is rendered and 12 of 20 children are currently present (checked-in and not checked-out)
- **THEN** the system displays a localized "Today assistance" header and a Jardín metric showing 12/20

#### Scenario: No children currently present
- **WHEN** the summary panel is rendered and no children are currently present
- **THEN** the Jardín metric shows 0 over the total children count

#### Scenario: Loading state before the counts resolve
- **WHEN** the summary panel is rendered and the present count or children count has not yet resolved
- **THEN** the system displays a non-error placeholder in place of the metric value

#### Scenario: Workshops metric removed
- **WHEN** the summary panel is rendered
- **THEN** no Workshops (Talleres) metric is displayed

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

### Requirement: Localized text source for Admin Options

All user-facing text on the Admin Options screen — the page title, the shortcut section header, every tile label (including the Asistencia tile), the Total of Kids label, the Today assistance header, and the Jardín (child care) label — SHALL be sourced from the app's i18n message catalog (`next-intl`) rather than hardcoded literals.

#### Scenario: All labels come from the message catalog
- **WHEN** the Admin Options screen is rendered
- **THEN** every header and label — including the Asistencia tile label — is read from the i18n catalog
- **AND** no header or label is a hardcoded literal in the components

#### Scenario: Locale determines displayed text
- **WHEN** the active locale resolves to Spanish
- **THEN** the screen's titles and labels display their Spanish translations from the catalog

### Requirement: Design system alignment

The Admin Options screen and its components SHALL be built with the app's existing HeroUI components and Heroicons, following established conventions (accessible labels sourced from the i18n catalog, `onPress` handlers for interactive controls, and `@/` import paths).

#### Scenario: Components use design-system primitives
- **WHEN** the Admin Options screen is rendered
- **THEN** its shortcut tiles and summary panel use HeroUI components and Heroicons consistent with the rest of the app, and each interactive control exposes an accessible label sourced from the i18n catalog
