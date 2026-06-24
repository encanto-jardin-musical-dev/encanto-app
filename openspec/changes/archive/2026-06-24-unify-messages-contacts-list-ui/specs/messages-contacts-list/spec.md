## ADDED Requirements

### Requirement: Contacts list uses the unified card row style
The messages contacts list (`/messages`) SHALL render each contact row using the same card visual style as the admin entity lists: a round photo avatar (with `UserCircleIcon` fallback), a bold full name, a translated role subtitle preceded by a role icon, each row wrapped in a `bg-default-100 rounded-lg p-2` card background, with rows separated by vertical spacing (no bottom divider).

#### Scenario: Contact with avatar displays photo
- **WHEN** a contact has a resolved avatar signed URL
- **THEN** the row SHALL display the photo in a round avatar, the contact's full name in bold, and their translated role with a role icon as a muted subtitle

#### Scenario: Contact without avatar displays icon fallback
- **WHEN** a contact has no avatar URL
- **THEN** the row SHALL display `UserCircleIcon` in a round avatar placeholder, the contact's full name in bold, and their translated role with a role icon as a muted subtitle

#### Scenario: Row tap navigates and pre-populates conversation header
- **WHEN** the user taps a contact row
- **THEN** the app SHALL navigate to `/messages/<contactId>` AND store the contact's id, name, role, and avatar URL in `receiverAtom` so the conversation header can display them immediately without waiting for a network fetch

#### Scenario: Each row has a card background
- **WHEN** the contacts list renders
- **THEN** each row SHALL have its own `bg-default-100 rounded-lg p-2` card background and SHALL NOT show a bottom divider, matching the admin entity list card style

#### Scenario: Cards are spaced apart
- **WHEN** the contacts list renders multiple rows
- **THEN** the cards SHALL be separated by vertical spacing rather than sitting flush

### Requirement: Contacts list shows a localized role subtitle
Each contact row SHALL display the contact's role as a localized label (from the `MessagesContacts.role` namespace) preceded by a role-specific icon, rather than the raw role string. Roles without a translation SHALL fall back to displaying the raw role value.

#### Scenario: Known role is translated with an icon
- **WHEN** a contact's role is `teacher`, `admin`, or `parent`
- **THEN** the subtitle SHALL show the localized label (`Maestro`, `Administrador`, `Acudiente`) preceded by the matching role icon (academic cap, shield, person)

#### Scenario: Unknown role falls back to raw value
- **WHEN** a contact's role has no matching translation key
- **THEN** the subtitle SHALL display the raw role string preceded by the default person icon

### Requirement: Contacts list provides a search bar
The messages contacts list SHALL display a search bar above the list, using the same `AdminSearchBar` style as the admin entity lists, that filters contacts by full name on the client as the user types.

#### Scenario: Search bar always visible
- **WHEN** the contacts list renders
- **THEN** a search input styled like the admin entity list search bar SHALL be shown above the rows, fixed while the list scrolls

#### Scenario: Filtering by name
- **WHEN** the user types into the search bar
- **THEN** the list SHALL show only contacts whose full name contains the typed text (case-insensitive)

#### Scenario: No matches
- **WHEN** the search text matches no contacts
- **THEN** the list SHALL show an empty-state message instead of rows
