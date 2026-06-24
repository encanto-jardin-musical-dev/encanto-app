## ADDED Requirements

### Requirement: Reusable entity multi-select
The system SHALL provide a single reusable multi-select component for assigning a set of entities (e.g. guardians to a child, teachers to a group). The component SHALL accept the available items, the currently selected ids, a change handler, and label/placeholder text, and SHALL keep selection state consistent with the available items.

#### Scenario: Selecting multiple entities
- **WHEN** a user opens the multi-select and selects two or more items
- **THEN** the change handler receives the full set of selected ids

#### Scenario: Orphaned selection is purged
- **WHEN** the available items change such that a previously selected id is no longer present
- **THEN** that id is removed from the selection so no stale ids remain

#### Scenario: Behavior parity with prior selectors
- **WHEN** the guardians selector in the child form and the teachers selector in the group form are migrated to the shared component
- **THEN** each continues to assign its respective entities exactly as before, with no change to the resulting links

### Requirement: Reusable image picker
The system SHALL provide a reusable image picker (component plus hook) that manages a tri-state image value of "unchanged" (undefined), "new file" (File), or "removed" (null), creates and revokes object-URL previews, and restricts uploads to the allowed image types.

#### Scenario: Picking a new image
- **WHEN** a user selects an image file in the picker
- **THEN** the picker exposes the chosen File and shows a preview of it

#### Scenario: Removing an existing image
- **WHEN** a user removes the current image
- **THEN** the picker reports the value as removed (null) and shows the fallback icon

#### Scenario: Preview cleanup
- **WHEN** the picker is replaced or unmounted after a blob preview was created
- **THEN** the object URL is revoked so no preview blob is leaked

### Requirement: Reusable confirm-delete modal
The system SHALL provide a single confirm-delete modal used by both the children and groups delete flows, displaying the entity name and disabling/showing-loading on its confirm action while a deletion is pending.

#### Scenario: Confirming a deletion
- **WHEN** a user confirms deletion in the modal
- **THEN** the confirm handler is invoked and the confirm control shows a pending state until it resolves

#### Scenario: Cancelling a deletion
- **WHEN** a user cancels the modal
- **THEN** no deletion is triggered and the modal closes

### Requirement: Reusable avatar chip and section
The system SHALL provide a reusable "avatar circle/square + name" chip and a section wrapper that renders a titled, wrapping grid of such chips with an empty-state label, used for teacher, child, and guardian lists across detail screens.

#### Scenario: Rendering a list of entities
- **WHEN** a detail screen renders a non-empty set of associated entities through the section
- **THEN** each entity is shown as a chip with its avatar (or fallback icon) and name

#### Scenario: Empty associated set
- **WHEN** a detail screen renders an empty set through the section
- **THEN** the section displays its empty-state label and no chips

### Requirement: Reusable list-row link and admin list/search
The system SHALL provide a reusable list-row link (avatar, title, optional subtitle) and reusable admin search and infinite-scroll list building blocks, such that the children and groups list/search components are thin wrappers that inject their own data hook and translation namespace without changing query keys or paging behavior.

#### Scenario: Navigating from a list row
- **WHEN** a user taps a list-row link
- **THEN** the app navigates to that entity's detail route

#### Scenario: Debounced search
- **WHEN** a user types into the admin search input
- **THEN** the search term is emitted after the debounce interval

#### Scenario: Infinite scroll paging preserved
- **WHEN** a user scrolls a migrated list to its sentinel
- **THEN** the next page is fetched using the same query key and page size as before the refactor

### Requirement: Reusable join-table reconciliation
The system SHALL provide a single join-table reconciliation helper that, given the desired set of links and the existing links for a parent, inserts missing links and deletes removed ones. It SHALL back the `child_groups`, `child_guardians`, and `group_teachers` reconciliations.

#### Scenario: Adding and removing links
- **WHEN** the desired set adds some ids and removes others relative to the existing links
- **THEN** the helper inserts only the new links and deletes only the removed links, leaving unchanged links intact

#### Scenario: Clearing all links
- **WHEN** the desired set is empty for a parent that currently has links
- **THEN** the helper deletes all of that parent's links

#### Scenario: Mutable link payload is re-synced
- **WHEN** a link key (e.g. guardian) is unchanged but a mutable field on the link (e.g. relationship) changes
- **THEN** the helper updates the stored link to reflect the new field value

### Requirement: Shared image storage utility
The system SHALL provide a single image-storage utility, parameterized by bucket and file label, that validates type and size, uploads to Supabase Storage, and resolves stored paths to signed URLs (single and batch), replacing the duplicated child-avatar and group-image utilities while preserving their limits, allowed types, error messages, and signed-URL TTL.

#### Scenario: Valid upload
- **WHEN** a valid image within the size and type limits is uploaded for an entity
- **THEN** the file is stored in the configured bucket and its storage path is returned

#### Scenario: Invalid upload rejected
- **WHEN** a file exceeds the size limit or has a disallowed type
- **THEN** a validation error is raised and nothing is uploaded

#### Scenario: Resolving signed URLs
- **WHEN** stored paths are resolved for display
- **THEN** the utility returns signed URLs (omitting any path that fails to sign) using the configured TTL

### Requirement: Shared profiles-by-role query
The system SHALL provide a single query that returns profiles filtered by role, ordered by last then first name, optionally including the avatar, replacing the separate available-parents and available-teachers queries without changing their results.

#### Scenario: Fetching teachers
- **WHEN** the query is called for the teacher role
- **THEN** it returns the teacher profiles ordered by last name then first name

#### Scenario: Fetching parents with avatar
- **WHEN** the query is called for the parent role with the avatar option enabled
- **THEN** it returns the parent profiles including their avatar, ordered by last name then first name

### Requirement: Behavior-preserving refactor
The shared abstractions SHALL be introduced without changing any externally observable behavior of the existing Children and Groups admin flows.

#### Scenario: Existing flows unchanged
- **WHEN** an admin creates, edits, or deletes a child or group, assigns guardians or teachers, uploads or removes an image, searches, or scrolls a list after the refactor
- **THEN** the outcome is identical to before the refactor, with no change to data written, routes, or visible UI

#### Scenario: No i18n key removals
- **WHEN** the shared components are adopted
- **THEN** existing `AdminChildren` and `AdminGroups` message keys remain in use via props, with no keys removed
