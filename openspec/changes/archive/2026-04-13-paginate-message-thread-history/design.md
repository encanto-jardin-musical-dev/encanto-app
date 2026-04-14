## Context

Today's flow for `/messages/[senderID]`:
1. `MessagesList.tsx` calls `UseGetMessagesQuery({ params: { userID: senderID } })`.
2. `get-messages.ts` runs `from("detailed_messages").select("*").or("sender_id.eq.X,receiver_id.eq.X").order("message_created_at")` with **no LIMIT**.
3. The result is mirrored into `messagesAtom` (Jotai). Realtime INSERT/UPDATE subscriptions append into the same atom.
4. A `useEffect` scrolls to bottom whenever `messages` changes.

Two problems:
- **No pagination.** Long threads fetch everything.
- **Wrong scoping.** The `.or(...)` filter is not intersected with the current user, so the query returns *every* message where the *other* party is sender or receiver — including conversations that have nothing to do with the current user. This happens to work in practice only because RLS trims the result set server-side. We should not rely on RLS as the query filter.

WhatsApp-style UX we want:
- Open thread → 25 newest messages visible instantly, scrolled to bottom.
- Scroll up → older page appears above, viewport stays anchored on the message the user was reading.
- New incoming message → appended to bottom, auto-scroll only if the user was already near the bottom. Otherwise, a "↓ Nuevo mensaje" pill appears at the bottom of the viewport and jumps to the latest message on click.

## Goals / Non-Goals

**Goals:**
- Bound initial thread fetch to 25 messages regardless of thread length.
- Load older pages of 25 on scroll-up with no visible "jump".
- Keep realtime append, mark-as-read, and optimistic send working.
- Show a "↓ Nuevo mensaje" pill when a new message arrives while the user is scrolled up.
- **Fix the conversation-scoping bug** in `get-messages.ts` (query must intersect with the current user instead of depending on RLS).
- **Fix the shared React Query key leak** in `UseGetMessagesQuery` (the hardcoded `["get-messages"]` key leaks cache across threads).
- **Collapse the three sources of truth** (React Query + `messagesAtom` + realtime callbacks) into one: React Query becomes authoritative.

**Non-Goals:**
- Jump-to-date / search within thread (future work).
- Virtualized list rendering (`react-virtual` etc.) — not needed at 10-per-page granularity; revisit only if pages are rendered 50+ deep.
- Changing the group chat data model.
- Reworking the message list screen at `/messages` (thread list, not thread detail).
- Server-side views or RPC functions — we keep using `detailed_messages`.

## Decisions

### Decision 1: Keyset pagination, not offset
**Chosen:** Cursor = `(message_created_at, message_id)`. Next-page query: `WHERE (message_created_at, message_id) < (cursor_created_at, cursor_id) ORDER BY message_created_at DESC, message_id DESC LIMIT 10`.

**Rationale:**
- Offset pagination drifts when new messages arrive (row N changes).
- Keyset is stable under concurrent inserts — critical because realtime appends happen constantly.
- The composite `(created_at, id)` tie-breaker handles the (rare) case of identical timestamps.
- Supabase PostgREST supports this via `.lt("message_created_at", cursor).order(...).limit(10)` — or, for the composite version, an RPC. We'll start with the simpler `lt` on `message_created_at` alone and add the tie-breaker only if we see ordering issues.

**Alternative considered:** `.range(offset, offset + 9)` — rejected due to drift + the fact that it still reads all preceding rows server-side.

### Decision 2: Fetch DESC, render ASC
**Chosen:** Query returns newest-first (DESC), client reverses each page for display.

**Rationale:** Keyset on "older than cursor" only works naturally with DESC ordering. The UI wants oldest-at-top, so we flatten `pages` and reverse once at render time. React Query's `InfiniteData<Page>` already shapes this well.

### Decision 3: `useInfiniteQuery` with cursor in `getNextPageParam`
**Chosen:** Replace `useQuery` with `useInfiniteQuery`:
```ts
useInfiniteQuery({
  queryKey: ["messages", currentUserId, threadId],
  queryFn: ({ pageParam }) => getMessagesPage(client, {
    currentUserId, threadId, cursor: pageParam, pageSize: 10,
  }),
  initialPageParam: null,
  getNextPageParam: (lastPage) =>
    lastPage.length < 10 ? undefined : lastPage[lastPage.length - 1].message_created_at,
});
```
Note: in React Query semantics, "next page" in this infinite list = **older** messages (scroll up). This is a naming quirk but matches the library's API. We document it in the hook.

**Query key strategy:** include both the current user ID and the thread partner/group ID so switching accounts or threads fully isolates caches. Today the key is hardcoded `["get-messages"]`, which leaks cache across threads — fixing that is a side win.

### Decision 4: Scroll anchoring on prepend
**Chosen:** Before prepending an older page, record `scrollHeight - scrollTop` (distance from bottom). After the new page renders, set `scrollTop = scrollHeight - savedDistance`.

**Rationale:** This is the WhatsApp technique and works without layout measurement per row. Implementation lives in `MessagesList.tsx` via a `useLayoutEffect` that runs when `pages.length` changes and a ref-tracked "is prepending" flag.

**Alternative considered:** `overflow-anchor: auto` (CSS only). Browser support is decent but behavior differs across engines for programmatic prepend; explicit scroll math is more reliable.

### Decision 5: Top sentinel with IntersectionObserver
**Chosen:** Render an invisible `<div ref={topSentinelRef} />` at the top of the list. An `IntersectionObserver` calls `fetchNextPage()` when the sentinel enters the viewport, **only if** `hasNextPage && !isFetchingNextPage`.

**Rationale:** Cheaper than a scroll listener (no rAF throttling needed), and avoids fetching when the user is actively scrolling down.

**Loading indicator:** when `isFetchingNextPage` is true, render a small spinner above the first message. Hide it as soon as the page lands.

### Decision 6: Realtime integration against the React Query cache
**Chosen:** Remove the Jotai `messagesAtom` for thread rendering. In the realtime handlers, call `queryClient.setQueryData(["messages", currentUserId, threadId], (data) => ...)` to append the new message to `pages[0]` (the newest page).

**Rationale:**
- Two sources of truth (atom + cache) is the root cause of the current scroll jitter and read-status bugs.
- `setQueryData` keeps infinite-query structure intact and triggers re-render automatically.
- Optimistic sends use the same path: prepend to `pages[0]` with a temp id, replace on server ack.

**Mark-as-read:** continues to work via the existing mutation; realtime UPDATE events patch the message inside whichever page contains it using `setQueryData`.

**Auto-scroll rule:** keep an `isAtBottomRef` (updated from scroll handler; "at bottom" = within 100px of `scrollHeight`). On new-message insert:
- If sender is current user → always scroll to bottom (and hide the pill).
- Else if `isAtBottomRef.current` → scroll to bottom (and hide the pill).
- Else → keep scroll position and render the "↓ Nuevo mensaje" pill as a floating button near the bottom of the thread viewport.

**Pill behavior:**
- Implemented as an absolutely-positioned HeroUI `Button` (or styled `div`) anchored to the bottom-center of the scroll container.
- Visibility state is component-local (`const [hasUnread, setHasUnread] = useState(false)`), set to `true` when an incoming message arrives and the user is not at the bottom.
- Click handler scrolls to bottom and resets `hasUnread` to false.
- Also resets to false when the user manually scrolls back to the bottom (detected via the same `isAtBottomRef` logic).
- Copy: `↓ Nuevo mensaje` (single) / `↓ N mensajes nuevos` (multiple) — the count comes from a `unreadCountRef` that increments on each skipped auto-scroll and resets on dismiss. Use `next-intl` for the localized string.

### Decision 7: Fix scoping inside the query function
**Chosen:** `get-messages.ts` accepts `{ currentUserId, threadId, cursor, pageSize }` and builds:
```
.from("detailed_messages")
.select("*")
.or(
  `and(sender_id.eq.${currentUserId},receiver_id.eq.${threadId}),` +
  `and(sender_id.eq.${threadId},receiver_id.eq.${currentUserId})`
)
.order("message_created_at", { ascending: false })
.limit(pageSize)
```
plus `.lt("message_created_at", cursor)` when a cursor is provided.

For group threads the filter switches to `.eq("group_id", threadId)`. The hook decides which variant to call based on a `kind: "direct" | "group"` parameter.

**Rationale:** This fixes the latent bug by making the filter explicit and stops depending on RLS as a filter.

### Decision 8: Page size = 25
25 balances initial-paint cost against scroll-fetch chattiness — close to WhatsApp's ~30 without bloating the first paint. Kept as a single `PAGE_SIZE` constant so it's trivial to tune if telemetry shows a different sweet spot.

## Risks / Trade-offs

- **[Scroll anchoring math drifts with dynamic row heights (images, long text)]** → Mitigation: anchor on "distance from bottom", not "distance from top"; re-measure inside `useLayoutEffect` before the browser paints. If drift is still visible we can anchor on a specific message element's offsetTop instead.
- **[Realtime INSERT for a page that isn't in cache]** → Mitigation: new messages always go to `pages[0]` (newest page). Older pages are static. This only breaks if a very-out-of-order insert happens, which is not a realistic scenario.
- **[Page size of 25 still causes chatty network for users who scroll fast through very long threads]** → Mitigation: PAGE_SIZE constant can be tuned in one place; IntersectionObserver debounces via `!isFetchingNextPage`.
- **[Mark-as-read patch lands on a message not in any loaded page]** → Mitigation: no-op is safe; the next load will have the current read state from the DB.
- **[Jotai messagesAtom has downstream consumers we don't see]** → Mitigation: audit usages before removal; if any live outside `MessagesList`, keep the atom but stop writing to it from the list.
- **[Conversation-scoping fix changes visible history for any user relying on the old buggy behavior]** → Very unlikely (RLS was already trimming), but verify by diffing thread contents before/after on a staging account.

## Migration Plan

No DB migration. Rollout order:
1. Land query + hook changes behind no flag (they're strictly additive at the module API level).
2. Rework `MessagesList.tsx` to consume the new hook in the same PR.
3. Audit and remove/shrink `messagesAtom` usage in the same PR.
4. Manually verify on staging: open a short thread (<10 messages), a medium one (~30), and a long one (200+). Confirm scroll-anchoring, realtime append, mark-as-read, send-message optimistic flow.
5. Ship.

Rollback: revert the PR — no data-side changes to undo.

## Open Questions

1. Is the `messagesAtom` referenced by any component outside `MessagesList.tsx`? This is a quick grep during implementation — if nothing else reads it, delete the atom; otherwise stop writing to it from the list and leave the atom for its remaining consumer.
