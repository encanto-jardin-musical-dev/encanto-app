## ADDED Requirements

### Requirement: Current-User Atoms Hydrated On Every Authenticated Route

The application SHALL populate `userIdAtom`, `userRoleAtom`, `userFirstNameAtom`, `userLastNameAtom`, `userAvatarAtom`, and `userSelectOptionsAtom` on every cold load of an authenticated route, not only when the user navigates through `/feed`. Hydration MUST be driven by the authenticated Supabase session, not by route-specific components.

#### Scenario: Cold load of `/messages/<id>`

- **WHEN** an authenticated user reloads or directly navigates to `/messages/<id>` without first visiting `/feed`
- **THEN** `userIdAtom` SHALL contain the authenticated user's id and `userRoleAtom` SHALL contain their role by the time `MessagesList` and `MessageInput` render their first effect

#### Scenario: Cold load of `/messages`

- **WHEN** an authenticated user reloads or directly navigates to `/messages`
- **THEN** `userAtom` SHALL contain a populated `id` and `role` so that `MessagesContactsList` fires its contacts query and the "No contacts found" fallback is not rendered spuriously

#### Scenario: Push-notification deep link

- **WHEN** the user clicks a background push notification that routes to `/messages/<id>` from a tab that has never visited `/feed`
- **THEN** the current-user atoms SHALL be hydrated and the reply `receiver_id` / `sender_id` payload SHALL be complete

### Requirement: Single Source Of Hydration

The current-user atoms SHALL have exactly one writer in the running application. `src/components/feed/FeedUser.tsx` SHALL NOT write to `userIdAtom`, `userRoleAtom`, or `userSelectOptionsAtom` — it SHALL read from them like every other consumer.

#### Scenario: Codebase audit

- **WHEN** the codebase is searched for writes to `userIdAtom`, `userRoleAtom`, or `userSelectOptionsAtom`
- **THEN** the only writers SHALL be the dedicated `UserHydrator` component (or equivalent)

### Requirement: PostHog Identify Runs With Hydration

The PostHog `identify(id)` call SHALL run from the same hydration path as the atom writes, so analytics attribution is available on every authenticated route.

#### Scenario: Event emitted from `/messages/<id>` cold load

- **WHEN** an analytics event is emitted during a cold load of `/messages/<id>`
- **THEN** the event SHALL be attributed to the authenticated user, not to an anonymous session
