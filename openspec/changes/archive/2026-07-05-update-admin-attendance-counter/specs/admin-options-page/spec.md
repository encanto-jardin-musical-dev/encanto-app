# Delta Spec: admin-options-page

## MODIFIED Requirements

### Requirement: Today assistance with mocked data

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

### Requirement: Localized text source for Admin Options

All user-facing text on the Admin Options screen — the page title, the shortcut section header, every tile label, the Total of Kids label, the Today assistance header, and the Jardín (child care) label — SHALL be sourced from the app's i18n message catalog (`next-intl`) rather than hardcoded literals.

#### Scenario: All labels come from the message catalog

- **WHEN** the Admin Options screen is rendered
- **THEN** every header and label is read from the i18n catalog
- **AND** no header or label is a hardcoded literal in the components

#### Scenario: Locale determines displayed text

- **WHEN** the active locale resolves to Spanish
- **THEN** the screen's titles and labels display their Spanish translations from the catalog
