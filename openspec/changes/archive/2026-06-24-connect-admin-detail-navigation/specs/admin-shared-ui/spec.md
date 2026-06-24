## MODIFIED Requirements

### Requirement: Reusable avatar chip and section
The system SHALL provide a reusable "avatar circle/square + name" chip and a section wrapper that renders a titled, wrapping grid of such chips with an empty-state label, used for teacher, child, and guardian lists across detail screens. The chip SHALL accept an optional navigation destination; when a destination is provided the chip SHALL render as a navigation link to that destination, and when no destination is provided the chip SHALL render as a non-interactive element with its current appearance unchanged.

#### Scenario: Rendering a list of entities
- **WHEN** a detail screen renders a non-empty set of associated entities through the section
- **THEN** each entity is shown as a chip with its avatar (or fallback icon) and name

#### Scenario: Empty associated set
- **WHEN** a detail screen renders an empty set through the section
- **THEN** the section displays its empty-state label and no chips

#### Scenario: Chip with a navigation destination
- **WHEN** a chip is given a navigation destination
- **THEN** the chip renders as a link that navigates to that destination when activated, while keeping the same avatar and name appearance

#### Scenario: Chip without a navigation destination
- **WHEN** a chip is given no navigation destination
- **THEN** the chip renders as a non-interactive element with its appearance unchanged from before this capability
