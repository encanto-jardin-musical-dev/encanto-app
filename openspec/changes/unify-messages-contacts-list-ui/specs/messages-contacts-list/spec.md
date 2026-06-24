## ADDED Requirements

### Requirement: Contacts list uses unified entity row style
The messages contacts list (`/messages`) SHALL render each contact row using the same visual style as the admin entity lists: a round photo avatar (with `UserCircleIcon` fallback), a bold full name, a muted role subtitle, and a bottom-divider separator between rows — with no per-row card background.

#### Scenario: Contact with avatar displays photo
- **WHEN** a contact has a resolved avatar signed URL
- **THEN** the row SHALL display the photo in a round avatar, the contact's full name in bold, and their role as a muted subtitle

#### Scenario: Contact without avatar displays icon fallback
- **WHEN** a contact has no avatar URL
- **THEN** the row SHALL display `UserCircleIcon` in a round avatar placeholder, the contact's full name in bold, and their role as a muted subtitle

#### Scenario: Row tap navigates and pre-populates conversation header
- **WHEN** the user taps a contact row
- **THEN** the app SHALL navigate to `/messages/<contactId>` AND store the contact's id, name, role, and avatar URL in `receiverAtom` so the conversation header can display them immediately without waiting for a network fetch

#### Scenario: Row list has no per-row card background
- **WHEN** the contacts list renders
- **THEN** rows SHALL be separated by a bottom divider with no individual card/panel background per row, matching the admin entity list visual style
