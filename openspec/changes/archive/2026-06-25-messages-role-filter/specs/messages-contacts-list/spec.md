## MODIFIED Requirements

### Requirement: Contacts list provides a search bar
The messages contacts list SHALL display a search bar above the list, using the same `AdminSearchBar` style as the admin entity lists, that filters contacts by full name on the client as the user types. When a role filter is also active, the name search SHALL apply on top of the already role-filtered result set.

#### Scenario: Search bar always visible
- **WHEN** the contacts list renders
- **THEN** a search input styled like the admin entity list search bar SHALL be shown above the rows, fixed while the list scrolls

#### Scenario: Filtering by name without role filter
- **WHEN** the user types into the search bar and no role filter is active
- **THEN** the list SHALL show only contacts whose full name contains the typed text (case-insensitive)

#### Scenario: Filtering by name with role filter active
- **WHEN** the user types into the search bar and a role filter is active
- **THEN** the list SHALL show only contacts whose full name contains the typed text (case-insensitive) AND whose role matches the active filter

#### Scenario: No matches
- **WHEN** the search text matches no contacts
- **THEN** the list SHALL show an empty-state message instead of rows
