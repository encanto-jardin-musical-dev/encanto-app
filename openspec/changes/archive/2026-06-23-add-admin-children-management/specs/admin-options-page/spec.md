## MODIFIED Requirements

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
