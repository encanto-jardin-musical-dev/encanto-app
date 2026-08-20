# admin-options-page (delta)

## MODIFIED Requirements

### Requirement: Entity creation shortcuts

The Admin Options screen SHALL present a "Create or edit new items" section containing five permanent shortcut tiles — Groups, Children, Teachers, Parents, and Asistencia — plus a sixth Cleanup tile that is displayed only when the PostHog feature flag `admin_cleanup` is enabled for the current user. Each tile SHALL be rendered with an icon and a localized label. Selecting a tile SHALL navigate the user to that entity's destination under the `/admin` route namespace (e.g., `/admin/children`); the Asistencia tile SHALL navigate to `/admin/attendance`, and the Cleanup tile SHALL navigate to `/admin/cleanup`.

#### Scenario: Shortcut tiles are displayed
- **WHEN** the Admin Options screen is rendered and the `admin_cleanup` flag is enabled
- **THEN** the system displays a localized section header and six tiles labeled Groups, Children, Teachers, Parents, Asistencia, and Cleanup, each with an icon

#### Scenario: Cleanup tile hidden when its flag is off
- **WHEN** the Admin Options screen is rendered and the `admin_cleanup` flag is disabled or unresolved
- **THEN** the system displays the five permanent tiles (Groups, Children, Teachers, Parents, Asistencia) and does not display the Cleanup tile

#### Scenario: Selecting a shortcut tile navigates
- **WHEN** the user selects one of the shortcut tiles
- **THEN** the system navigates to that entity's destination under `/admin` (e.g., the Children tile navigates to `/admin/children`)

#### Scenario: Selecting the Asistencia tile navigates to the attendance overview
- **WHEN** the user selects the Asistencia tile
- **THEN** the system navigates to `/admin/attendance`

#### Scenario: Selecting the Cleanup tile navigates to the cleanup screen
- **WHEN** the user selects the Cleanup tile
- **THEN** the system navigates to `/admin/cleanup`
