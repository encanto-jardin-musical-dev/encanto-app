# not-found-page

## Purpose
Provide a themed, app-consistent 404 experience for unmatched routes and for message threads that reference an invalid or nonexistent sender id, with a clear way back to the Feed.

## Requirements

### Requirement: Global themed 404 page
When a user navigates to any route that does not match an existing page, the app SHALL render a themed 404 page (matching the app's fonts, colors, and layout conventions) instead of Next.js's default unstyled 404 page.

#### Scenario: Unmatched top-level route
- **WHEN** a user navigates to a URL with no matching route (e.g. a mistyped path)
- **THEN** the app renders the themed 404 page, styled consistently with the rest of the app (same fonts, theme, and layout chrome as other pages)

#### Scenario: Unmatched nested/dynamic route
- **WHEN** a user navigates to a URL under an existing route segment but with a value that isn't otherwise handled (e.g. a deep link to a resource that no longer resolves)
- **THEN** the app renders the same themed 404 page, not Next's default 404

### Requirement: Message thread route validates its id and renders the 404 page for invalid or nonexistent ids
The message thread route (`/messages/[senderID]`) SHALL render the themed 404 page — not a server error and not a degraded-but-successful thread view — when the `senderID` path segment does not identify a real profile.

#### Scenario: Malformed id in the URL
- **WHEN** a user navigates to `/messages/<value>` where `<value>` is not a valid UUID (e.g. a truncated or corrupted deep link)
- **THEN** the app renders the themed 404 page instead of a server error

#### Scenario: Well-formed id with no matching profile
- **WHEN** a user navigates to `/messages/<uuid>` where `<uuid>` is correctly formatted but does not match any row in `profiles`
- **THEN** the app renders the themed 404 page instead of a thread view

### Requirement: Navigate back to Feed from the 404 page
The 404 page SHALL provide a visible, always-available action that navigates the user to `/feed`, and SHALL NOT block or trap navigation.

#### Scenario: User clicks the back-to-feed action
- **WHEN** a user on the 404 page activates the "back to feed" action
- **THEN** the browser navigates to `/feed`

#### Scenario: Action does not depend on auth or data state
- **WHEN** the 404 page renders, regardless of the user's authentication state or any backend availability
- **THEN** the back-to-feed action is present and functional (it performs a plain navigation, not a data-dependent operation)
