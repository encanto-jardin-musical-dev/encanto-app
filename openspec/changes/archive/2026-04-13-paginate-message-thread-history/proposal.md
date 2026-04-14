## Why

Opening a message thread currently fetches **every** message the user has ever exchanged via the `detailed_messages` view (`src/queries/messages/get-messages.ts`) with no `LIMIT` clause. For active teacher/parent threads this grows unboundedly: slower thread opens, larger Supabase payloads, higher memory pressure on mobile, and laggy scrolls as hundreds of `MessageCard` components mount on first render. WhatsApp-style pagination — load the most recent 25 messages instantly and fetch older pages on scroll-up — matches the user's mental model and bounds the initial render cost.

While working in this area we also fix three pre-existing bugs that share the same root cause (ad-hoc thread state management): an unscoped query filter, a globally-shared React Query key, and a three-source-of-truth rendering pipeline (React Query + Jotai atom + realtime callbacks). Bundling these fixes prevents the pagination work from papering over problems that would immediately re-surface.

## What Changes

- Change `get-messages.ts` to keyset-paginate by `message_created_at` + `message_id`, returning pages of 25 messages sorted DESC (newest-first on the wire, reversed in the UI).
- Replace `UseGetMessagesQuery` (a plain `useQuery`) with `useInfiniteQuery`, using the oldest fetched message as the cursor for the next page.
- Update `MessagesList.tsx` to:
  - Render the flattened pages in chronological order.
  - Anchor scroll position when older pages prepend (no jump — same technique WhatsApp uses).
  - Trigger `fetchNextPage` when the user scrolls near the top (IntersectionObserver on a top sentinel).
  - Auto-scroll to bottom only on initial load and on new realtime messages (not when older pages load).
- Integrate realtime INSERTs with the paginated cache: new messages append to the newest page; existing optimistic-send and mark-as-read flows keep working.
- Preserve support for both 1:1 and group threads (the senderID param covers both today — this change keeps that unchanged).
- Add a "↓ Nuevo mensaje" floating pill that appears when a new message arrives while the user is scrolled away from the bottom; clicking it jumps to the latest message.

### Bundled bug fixes (in scope)

1. **Fix the conversation-scoping bug in `get-messages.ts`**: the current OR filter (`sender_id.eq.${otherUserID},receiver_id.eq.${otherUserID}`) does not intersect with the current user, so it returns the other user's full message history across all conversations. The only reason the UI looks correct today is that RLS trims the result set. The paginated query MUST scope correctly to "messages between the current user and the thread partner" for direct threads, and `group_id = threadId` for group threads — without relying on RLS as the filter.
2. **Fix the shared React Query key leak**: `UseGetMessagesQuery` uses a hardcoded `queryKey: ["get-messages"]`, so switching between threads reads stale cache from the previous thread. The key MUST become `["messages", currentUserId, threadId]` so caches are isolated per user and per thread.
3. **Collapse the three sources of truth**: thread state is currently held simultaneously in (a) the React Query cache, (b) the `messagesAtom` Jotai atom, and (c) inline realtime callbacks. This is the root cause of scroll jitter and read-status staleness. React Query becomes the single source of truth; realtime handlers write via `queryClient.setQueryData`; the `messagesAtom` is removed (or shrunk to UI-only state after an audit).

## Capabilities

### New Capabilities
- `message-pagination`: Paginated, scroll-to-load-older message thread rendering with realtime append and scroll-anchoring.

### Modified Capabilities
<!-- None — no existing spec defines message thread fetch behavior. -->

## Impact

- **Modified code**:
  - `src/queries/messages/get-messages.ts` — accept `cursor`, return keyset page of 10 scoped correctly to the conversation
  - `src/hooks/UseGetMessagesQuery.ts` — switch to `useInfiniteQuery`, expose `fetchNextPage`, `hasNextPage`, `isFetchingNextPage`
  - `src/components/messages/MessagesList.tsx` — flatten pages, add top sentinel + IntersectionObserver, scroll-anchoring on prepend, rework realtime-append logic against React Query cache instead of Jotai atom
  - `src/lib/store/messages.ts` — likely shrink or remove `messagesAtom` usage for thread rendering
  - `src/types/messages.types.ts` — add `MessagePage` / cursor types
- **No DB migration required** — keyset pagination uses existing columns and can be served by the current `detailed_messages` view (assuming it exposes `message_id` and `message_created_at`, which it already does).
- **Performance**: initial thread payload drops from O(all-messages) to 25 rows; first paint should be sub-second even on long threads.
- **No breaking API changes** — the UI contract for `MessageCard` stays the same.
