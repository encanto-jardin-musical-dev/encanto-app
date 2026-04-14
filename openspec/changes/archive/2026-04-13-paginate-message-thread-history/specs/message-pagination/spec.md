## ADDED Requirements

### Requirement: Initial thread load fetches a single page
When a user opens a message thread, the client SHALL fetch at most 25 messages — the most recent ones in that conversation — and display them scrolled to the bottom.

#### Scenario: Opening a thread with more than 25 messages
- **WHEN** a user opens a thread containing 250 messages
- **THEN** the initial network request returns 25 messages and the list is scrolled to the most recent one

#### Scenario: Opening a thread with fewer than 25 messages
- **WHEN** a user opens a thread containing 3 messages
- **THEN** the initial network request returns those 3 messages, the list is scrolled to the most recent one, and no "load more" indicator is shown

#### Scenario: Opening an empty thread
- **WHEN** a user opens a thread with no messages
- **THEN** the list renders empty, no spinner remains visible, and no further page requests are made

### Requirement: Scroll-up loads older pages
When the user scrolls near the top of the loaded history, the client SHALL automatically fetch the next older page of up to 25 messages and prepend them to the list.

#### Scenario: Scrolling up triggers older page fetch
- **WHEN** the user scrolls such that the top sentinel element enters the viewport
- **AND** more older messages exist on the server
- **AND** a fetch is not already in flight
- **THEN** the client requests the next older page and prepends the returned messages above the currently displayed ones

#### Scenario: No more messages to load
- **WHEN** the user scrolls to the top and the most recent fetched page contained fewer than 25 messages
- **THEN** no further fetch is made and no loading indicator is shown

#### Scenario: Duplicate fetch prevention
- **WHEN** the top sentinel is already visible and a page fetch is in flight
- **THEN** the client does NOT start a second fetch until the in-flight one resolves

### Requirement: Scroll position is preserved when older pages prepend
When an older page is prepended to the list, the user's visible scroll position SHALL remain anchored on the message they were reading — the viewport MUST NOT jump.

#### Scenario: User is reading mid-history when older page lands
- **WHEN** the user scrolls up until the top sentinel triggers a fetch
- **AND** the fetch resolves and older messages are prepended
- **THEN** the message that was under the user's viewport before the prepend remains under the user's viewport after the prepend

### Requirement: New realtime messages append to the newest page
When a new message arrives via realtime subscription for the current thread, the client SHALL append it to the newest loaded page without refetching existing pages.

#### Scenario: Incoming message while viewing the bottom of the thread
- **WHEN** a new message arrives from the thread partner
- **AND** the user is scrolled within 100 pixels of the bottom
- **THEN** the message is appended to the displayed list and the list auto-scrolls to the new bottom

#### Scenario: Incoming message while reading older history
- **WHEN** a new message arrives from the thread partner
- **AND** the user is scrolled away from the bottom
- **THEN** the message is appended to the displayed list but the viewport scroll position is NOT changed

#### Scenario: Outgoing message sent by the current user
- **WHEN** the current user sends a message in the thread
- **THEN** the message appears in the list and the list scrolls to the bottom regardless of previous scroll position

### Requirement: Query is scoped to the current conversation
The messages query SHALL return only messages that belong to the active conversation — either the 1:1 pair `(currentUserId, threadId)` for direct threads or `group_id = threadId` for group threads. The query MUST NOT rely on RLS as the sole filter.

#### Scenario: Direct-thread query scoping
- **WHEN** the query runs for a direct thread between the current user and a partner
- **THEN** it returns only messages whose `(sender_id, receiver_id)` matches that pair in either direction

#### Scenario: Group-thread query scoping
- **WHEN** the query runs for a group thread
- **THEN** it returns only messages whose `group_id` equals the thread id

### Requirement: React Query is the single source of truth for thread state
Thread rendering, realtime updates, optimistic sends, and mark-as-read updates SHALL all operate against the React Query cache. The thread list component MUST NOT maintain a parallel copy of the messages in Jotai atoms or component state.

#### Scenario: Realtime insert updates the cache directly
- **WHEN** a realtime INSERT event fires for the current thread
- **THEN** the handler updates the React Query infinite-query cache via `setQueryData` and the list re-renders automatically

#### Scenario: Read-status update patches the cached message
- **WHEN** a realtime UPDATE event marks a message as read
- **THEN** the handler patches that message inside whichever cached page contains it using `setQueryData`

#### Scenario: Optimistic send
- **WHEN** the current user sends a message
- **THEN** a temporary entry is inserted into the newest page of the cache before the server responds, and it is replaced by the real row when the server acknowledges

### Requirement: Query keys isolate caches per user and per thread
The React Query key used for thread messages SHALL include both the current user id and the thread id so that navigating between threads or between accounts never shows stale data from another cache.

#### Scenario: Switching threads does not leak data
- **WHEN** a user navigates from thread A to thread B
- **THEN** the list for thread B is empty until its own fetch resolves — messages from thread A are not shown

### Requirement: New-message pill for unread messages while scrolled up
When a new incoming message arrives while the user is scrolled away from the bottom of the thread, the client SHALL display a floating "↓ Nuevo mensaje" pill near the bottom of the scroll container. The pill SHALL indicate how many new messages have been skipped, clicking it SHALL scroll the list to the newest message, and scrolling to the bottom manually SHALL dismiss it.

#### Scenario: Incoming message while scrolled up shows the pill
- **WHEN** a new message arrives from the thread partner
- **AND** the user is scrolled away from the bottom of the thread
- **THEN** a "↓ Nuevo mensaje" pill becomes visible anchored to the bottom of the scroll container

#### Scenario: Multiple skipped messages update the pill count
- **WHEN** three consecutive incoming messages arrive while the user remains scrolled up
- **THEN** the pill text reflects the total unread count (e.g. "↓ 3 mensajes nuevos")

#### Scenario: Clicking the pill jumps to the newest message
- **WHEN** the user clicks the pill
- **THEN** the list scrolls to the most recent message and the pill is hidden

#### Scenario: Manual scroll to bottom dismisses the pill
- **WHEN** the user scrolls to within 100 pixels of the bottom manually
- **THEN** the pill is hidden and the unread count resets to zero

#### Scenario: Pill does not appear when the user is at the bottom
- **WHEN** a new message arrives while the user is already within 100 pixels of the bottom
- **THEN** the message is appended, the list auto-scrolls to the new bottom, and the pill is NOT shown

#### Scenario: Pill does not appear for the current user's own outgoing messages
- **WHEN** the current user sends a message while scrolled up
- **THEN** the list scrolls to the bottom and the pill is NOT shown
