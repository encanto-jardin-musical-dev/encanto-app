## ADDED Requirements

### Requirement: Thread Participant Identity From URL

The `/messages/[senderID]` route SHALL derive the other participant's identity from the `senderID` URL parameter, not from in-memory client state. The route MUST render correctly on a cold load (reload, deep link, push-notification click) without requiring prior navigation through `/feed` or the contact list.

#### Scenario: Cold reload of a conversation route

- **WHEN** a user reloads the page while on `/messages/<id>`
- **THEN** the header SHALL display the other participant's name and avatar, and the message input SHALL construct its insert payload with `receiver_id` equal to `<id>` (the URL parameter, not in-memory atom state)

> Note: the end-to-end send success on cold reload also requires the current user to be hydrated; that guarantee is owned by the `user-session` spec in `hydrate-user-atoms-on-cold-load`.

#### Scenario: Push-notification deep link

- **WHEN** a user clicks a background push notification that routes to `/messages/<id>` from a tab that has never visited `/feed`
- **THEN** the header SHALL display the other participant's name

#### Scenario: Shared URL opened in a new tab

- **WHEN** a user opens a pasted `/messages/<id>` URL in a new tab
- **THEN** the page SHALL render the conversation header with the correct participant data

#### Scenario: Participant profile unavailable

- **WHEN** the `senderID` URL parameter does not resolve to an existing profile (deleted user or invalid id)
- **THEN** the header SHALL render a fallback label and the message input SHALL be disabled

### Requirement: Optimistic Participant Hydration From Feed

When the user navigates to `/messages/<id>` from a component that already holds the participant's profile (e.g. `MessageFeedCard` or `UserListItem`), the route SHALL render the header without a visible loading state by using the in-memory profile as initial data for the profile query.

#### Scenario: Navigation from a feed card

- **WHEN** a user clicks a `MessageFeedCard` whose `receiverAtom` write precedes the route change
- **THEN** `/messages/<id>` SHALL render the header immediately from the atom's value while the profile query validates in the background, with no visible fallback flash

#### Scenario: Atom value does not match URL

- **WHEN** the `receiverAtom` contains a profile whose `id` does not match the current `senderID` URL parameter
- **THEN** the route SHALL ignore the atom and fetch the profile from the database

### Requirement: Remove Unused `senderAtom`

The system SHALL NOT retain write-only client state that has no reader. The `senderAtom` in `src/lib/store/messages.ts` — which is written by `MessageFeedCard` but read nowhere — SHALL be removed, along with its `setSender(...)` call site.

#### Scenario: Codebase audit

- **WHEN** the codebase is searched for `senderAtom`
- **THEN** no occurrences SHALL remain outside of archived OpenSpec changes
