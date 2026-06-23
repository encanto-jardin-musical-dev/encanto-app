# admin-options-page

## Purpose

Defines the Admin Options dashboard screen — a role-appropriate landing page for admins with entity creation/editing shortcuts (Groups, Children, Teachers, Parents) and a summary panel (Total of Kids from real data; Today assistance split into Child care and Workshops, initially mocked), with all copy localized via i18n.
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

The Admin Options screen SHALL present a "Create or edit new items" section containing four shortcut tiles — Groups, Children, Teachers, and Parents — each rendered with an icon and a localized label. Selecting a tile SHALL navigate the user to that entity's destination under the `/admin` route namespace (e.g., `/admin/children`).

#### Scenario: Shortcut tiles are displayed
- **WHEN** the Admin Options screen is rendered
- **THEN** the system displays a localized section header and four tiles labeled Groups, Children, Teachers, and Parents, each with an icon

#### Scenario: Selecting a shortcut tile navigates
- **WHEN** the user selects one of the shortcut tiles
- **THEN** the system navigates to that entity's destination under `/admin` (e.g., the Children tile navigates to `/admin/children`)

### Requirement: Total of Kids from real data

The Admin Options screen SHALL display the Total of Kids as a single numeric value derived from the count of records in the `children` data source. The count SHALL be obtained without transferring the full set of child records (e.g., a count-only query), and the screen SHALL handle the loading state gracefully before the count resolves.

#### Scenario: Total of Kids reflects the children count
- **WHEN** the summary panel is rendered and the children count has resolved
- **THEN** the system displays a localized "Total of Kids" label and the numeric count of records in the `children` data source

#### Scenario: Loading state before the count resolves
- **WHEN** the summary panel is rendered and the children count has not yet resolved
- **THEN** the system displays a non-error placeholder in place of the value rather than crashing or showing a hardcoded number

### Requirement: Today assistance with mocked data

The Admin Options screen SHALL display a "Today assistance" block split into two metrics — Child care and Workshops — each presented as a `current/total` value. The assistance values SHALL be sourced from a single, swappable data provider that initially supplies mocked values, so the provider can later be replaced with live data without changing the UI.

#### Scenario: Today assistance metrics are shown
- **WHEN** the summary panel is rendered
- **THEN** the system displays a localized "Today assistance" header with a Child care metric and a Workshops metric, each shown as `current/total` using values supplied by the assistance data provider

#### Scenario: Assistance data source is swappable
- **WHEN** the assistance data provider is replaced with a different implementation that returns the same data shape
- **THEN** the summary panel renders the new values without requiring changes to the panel's UI components

### Requirement: Localized text source for Admin Options

All user-facing text on the Admin Options screen — the page title, the shortcut section header, every tile label, the Total of Kids label, the Today assistance header, and the Child care and Workshops labels — SHALL be sourced from the app's i18n message catalog (`next-intl`) rather than hardcoded literals.

#### Scenario: All labels come from the message catalog
- **WHEN** the Admin Options screen is rendered
- **THEN** every header and label is read from the i18n catalog
- **AND** no header or label is a hardcoded literal in the components

#### Scenario: Locale determines displayed text
- **WHEN** the active locale resolves to Spanish
- **THEN** the screen's titles and labels display their Spanish translations from the catalog

### Requirement: Design system alignment

The Admin Options screen and its components SHALL be built with the app's existing HeroUI components and Heroicons, following established conventions (accessible labels sourced from the i18n catalog, `onPress` handlers for interactive controls, and `@/` import paths).

#### Scenario: Components use design-system primitives
- **WHEN** the Admin Options screen is rendered
- **THEN** its shortcut tiles and summary panel use HeroUI components and Heroicons consistent with the rest of the app, and each interactive control exposes an accessible label sourced from the i18n catalog

