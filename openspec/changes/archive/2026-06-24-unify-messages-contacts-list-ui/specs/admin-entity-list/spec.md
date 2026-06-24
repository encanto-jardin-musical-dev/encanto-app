## ADDED Requirements

### Requirement: Admin routes provide a bounded full-height container
The admin route group SHALL provide a layout (`src/app/admin/layout.tsx`) that wraps every admin page in a bounded full-height container (`h-screen`), matching the messages route layout. This gives each admin page's `h-full` grid a definite height so that `grid-rows-[auto_*]` regions can pin fixed rows and scroll only the intended region.

#### Scenario: Admin pages have a definite height to pin against
- **WHEN** any admin page renders inside the admin route group
- **THEN** the page SHALL be wrapped in a full-height (`h-screen`) container so that its `h-full` grid resolves to the viewport height rather than to content height

#### Scenario: Layout adds no extra padding
- **WHEN** an admin page that already applies its own `p-4` renders inside the admin layout
- **THEN** the admin layout SHALL NOT add additional padding, avoiding double padding around the page content

### Requirement: Admin list header and search bar stay fixed while the list scrolls
Each admin entity list screen (children, teachers, parents, groups) SHALL keep its header (the `NavigationBar`) and search bar pinned at the top of the content area while only the list of rows scrolls. Scrolling the rows SHALL NOT move the header or search bar out of view.

#### Scenario: Scrolling a long list keeps the header and search bar visible
- **WHEN** a list has more rows than fit on screen and the user scrolls the rows
- **THEN** the header (`NavigationBar`) and the search bar SHALL remain fixed and fully visible at the top of the content area while the rows scroll beneath them

#### Scenario: Header and search bar position match the messages contacts list
- **WHEN** comparing an admin entity list screen with the messages contacts list
- **THEN** both SHALL pin the header and search bar above a single scrollable list region, using the same bounded full-height layout with fixed-header / scrollable-list regions

### Requirement: Admin list rows use a card style
Each admin entity list screen (children, teachers, parents, groups) SHALL render its rows in a card style: every row wrapped in a `bg-default-100 rounded-lg p-2` background, rows separated by spacing (no bottom divider), while keeping the round photo avatar (with `UserCircleIcon` fallback), bold title, and existing subtitle.

#### Scenario: Each row has a card background
- **WHEN** an admin entity list renders rows
- **THEN** each row SHALL have its own `bg-default-100 rounded-lg p-2` card background and SHALL NOT show a bottom divider

#### Scenario: Cards are spaced apart
- **WHEN** an admin entity list renders multiple rows
- **THEN** the cards SHALL be separated by vertical spacing rather than sitting flush

#### Scenario: Avatar and content preserved
- **WHEN** a row renders in card style
- **THEN** it SHALL still show the round photo avatar (or `UserCircleIcon` fallback), the bold title, and the existing subtitle content for that list
