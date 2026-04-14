## 1. Types and Constants

- [x] 1.1 Add a `PAGE_SIZE` constant (default `25`) in a single module so it can be tuned centrally
- [x] 1.2 Add `MessagePage` and cursor types to `src/types/messages.types.ts` (page = `Message[]`; cursor = `string | null` representing `message_created_at`)
- [x] 1.3 Add a `ThreadKind = "direct" | "group"` discriminator type

## 2. Query Function Rewrite

- [x] 2.1 Rewrite `src/queries/messages/get-messages.ts` to export `getMessagesPage(client, { currentUserId, threadId, kind, cursor, pageSize })`
- [x] 2.2 For `kind: "direct"`, build an `.or(...)` filter that matches both directions of the `(currentUserId, threadId)` pair
- [x] 2.3 For `kind: "group"`, use `.eq("group_id", threadId)` instead
- [x] 2.4 Always add `.order("message_created_at", { ascending: false }).limit(pageSize)`
- [x] 2.5 When `cursor` is non-null, add `.lt("message_created_at", cursor)`
- [x] 2.6 Handle Supabase errors explicitly; throw with a descriptive message

## 3. Hook Rewrite

- [x] 3.1 Rewrite `src/hooks/UseGetMessagesQuery.ts` to use `useInfiniteQuery`
- [x] 3.2 Query key: `["messages", currentUserId, threadId]` (replaces the hardcoded `["get-messages"]`)
- [x] 3.3 `initialPageParam: null`; `getNextPageParam` returns the oldest loaded `message_created_at` or `undefined` when the last page was short
- [x] 3.4 Accept `kind` and thread id as params; default to `"direct"` for back-compat callers
- [x] 3.5 Expose `fetchNextPage`, `hasNextPage`, `isFetchingNextPage`, and a derived `messages: Message[]` (flattened and reversed to ASC for render)
- [x] 3.6 Leave a short JSDoc noting that "next page" here means **older** messages

## 4. MessagesList Component Rework

- [x] 4.1 Consume the new `useInfiniteQuery`-based hook in `MessagesList.tsx`; remove the effect that copies data into `messagesAtom`
- [x] 4.2 Render the flattened messages directly from the hook result
- [x] 4.3 Add a top sentinel `<div ref={topSentinelRef} />` above the first message
- [x] 4.4 Install an `IntersectionObserver` on the sentinel that calls `fetchNextPage()` when visible, guarded by `hasNextPage && !isFetchingNextPage`
- [x] 4.5 Show a small spinner above the list while `isFetchingNextPage`
- [x] 4.6 On initial load and on outgoing sends, scroll to bottom (existing behavior)
- [x] 4.7 Track `isAtBottomRef` from scroll events; on incoming realtime insert, auto-scroll only when at bottom
- [x] 4.8 Implement scroll anchoring: before a page prepends (detected via a ref set in `fetchNextPage` callback), capture `scrollHeight - scrollTop`; in `useLayoutEffect` after render, restore `scrollTop = scrollHeight - saved`

## 4b. New-Message Pill

- [x] 4b.1 Add a `NewMessagePill` component (HeroUI Button, absolutely positioned, bottom-center of the scroll container)
- [x] 4b.2 Hold `unreadCount` in component state in `MessagesList.tsx`; default 0
- [x] 4b.3 On incoming realtime INSERT while `!isAtBottomRef.current`: increment `unreadCount` and do NOT auto-scroll
- [x] 4b.4 On incoming INSERT while `isAtBottomRef.current`: auto-scroll and reset `unreadCount` to 0
- [x] 4b.5 On outgoing send: scroll to bottom and reset `unreadCount` to 0
- [x] 4b.6 On manual scroll back to within 100px of bottom: reset `unreadCount` to 0
- [x] 4b.7 Render the pill only when `unreadCount > 0`; click handler scrolls to bottom and resets
- [x] 4b.8 Add i18n keys in `messages/es.json`: `messages.newMessagePill.one` = "↓ Nuevo mensaje", `messages.newMessagePill.other` = "↓ {count} mensajes nuevos"
- [x] 4b.9 Use `next-intl` `useTranslations` with ICU plural selection for the pill copy

## 5. Realtime → React Query Integration

- [x] 5.1 Replace realtime handlers that wrote to `messagesAtom` with `queryClient.setQueryData(["messages", currentUserId, threadId], updater)`
- [x] 5.2 Incoming INSERT: append to `pages[0]` (newest page) if not already present
- [x] 5.3 Outgoing INSERT (for echoes): same append logic, dedupe by message id to play nicely with optimistic send
- [x] 5.4 UPDATE (read-status): locate the message across pages and patch it in place, preserving page structure
- [x] 5.5 Verify `UseSendMessageMutation` still works end-to-end; add optimistic cache update if not already present

## 6. Jotai Cleanup

- [x] 6.1 Audit all usages of `messagesAtom` across the codebase (grep for `messagesAtom`)
- [x] 6.2 Remove writes from `MessagesList.tsx`
- [x] 6.3 If no other consumer remains, delete `messagesAtom` from `src/lib/store/messages.ts`; otherwise keep the atom but stop using it as the source of truth for the thread list

## 7. Manual QA

- [x] 7.1 Open a thread with 0 messages — list renders empty, no spinner lingers, no requests on scroll
- [x] 7.2 Open a thread with 3 messages — list renders, no "load more" sentinel fires
- [x] 7.3 Open a thread with ~80 messages — initial page shows last 25, scroll up loads next 25, then next 25, stops gracefully
- [x] 7.4 Open a thread with 500+ messages — scroll up multiple times; verify scroll anchoring does not jump
- [x] 7.5 Send a message — optimistic insert, scroll to bottom, ack replaces temp id
- [x] 7.6 Receive a message while at bottom — appended + scrolled, pill never appears
- [x] 7.7 Receive a message while scrolled up — appended, viewport does not move, pill appears with count 1
- [x] 7.8 Receive three more messages while still scrolled up — pill count shows 4
- [x] 7.9 Click the pill — list jumps to bottom, pill disappears
- [x] 7.10 Repeat 7.7 then manually scroll to bottom — pill dismisses on reaching bottom
- [x] 7.11 Switch between two threads quickly — no cross-thread data leak (validates the query-key fix)
- [x] 7.12 Mark-as-read still updates check marks in realtime
- [x] 7.13 Test on a group thread as well as a direct thread
- [x] 7.14 Verify the scoping fix: with two unrelated DM threads open in sequence, confirm neither shows messages that belong to a different conversation

## 8. Follow-ups

- [x] 8.1 Update `CLAUDE.md` if the Query/Hook pattern section needs a note about `useInfiniteQuery` usage
