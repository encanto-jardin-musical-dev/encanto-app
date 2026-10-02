## Context

The Feed's group context is a single persisted Jotai atom. `UserHydrator` populates `userSelectOptionsAtom` per role — for a teacher from `group_teachers` via `getUserGroups`, for an admin from all groups, for a parent each child's first `group_id` keyed by child id. `FeedUser` renders a HeroUI single-select over those options and writes to `groupContextSelectedAtom`; `groupContextSelectedAtom` derives `contextGroupValue` (one group id), which is the only group input to the whole feed and to outgoing teacher messages.

The selector carries `isDisabled={user.role === USER_ROLES.TEACHER}` (`FeedUser.tsx:120`), which has been present since the line was first written. Because `group_teachers` is many-to-many (since the archived `group-multiple-teachers` change) the disable is now a functional gap rather than a simplification: a multi-group teacher is locked to whatever group is first in their option list.

What already works and must not be disturbed:

- Read scoping is already correct per group. `getFeedUserMessages` filters `group_id.eq.<selected>` OR `group_id.is.null`; `getGroupTasks` filters `eq('group_id', groupId)`; `getGroupReports` filters `eq('group_id', groupId)`.
- Task and report realtime handlers in `FeedGroup` compare `row.group_id === groupContextId`, and the message handler compares `data.group_id === groupContextId || data.group_id === null`.
- RLS needs no change: `messages` SELECT is sender/receiver-scoped; `tasks` and `daily_reports` SELECT carry an `is_staff` bypass, which is also why the *client* must reconcile the stored context.
- i18n keys (`UserFeedPage.FeedUser.labels.other` / `placeholders.other`) already pluralize by option count and already apply to the teacher branch.

One latent weakness becomes important once teachers can actually switch: `useGetUserFeedMessages` uses a **static** `queryKey: ['user-feed-messages']` and `FeedGroup` compensates with a manual `refetchMessages()` effect on `groupContextId`. Tasks and reports key on the group id; messages do not. On a switch the cache for the previous group is served while the refetch is in flight, and because the populate effect only runs when `feedMeessages` is truthy, the previous group's rows stay rendered.

## Goals / Non-Goals

**Goals:**

- A teacher's selector is interactive and lists exactly the groups they are assigned to.
- Switching the selected group re-scopes feed messages, tasks, and reports to that group only, with no window in which a previous group's rows are visible.
- Outgoing teacher messages are tagged with the group the teacher actually selected.
- A stored group context that is no longer among the user's options is reconciled, so a teacher removed from a group stops reading it.
- Existing admin and parent behavior is unchanged.

**Non-Goals:**

- No "all my groups" aggregate feed view for staff. Single-select only.
- No RLS / policy / migration change.
- No change to how tasks and reports are *created* — `/tasks/new` and `/reports/new` use their own group field in the form.
- No change to the Messages contact list or role filters.
- No new i18n keys.

## Decisions

### D1 — Un-disable the existing `Select` instead of building a teacher-specific selector

`FeedUser` already renders an enabled, single-select HeroUI `Select` for admins over the same `userSelectOptionsAtom`, and `UserHydrator` already fills that atom with a teacher's `group_teachers` groups. Removing `isDisabled` is the entire fix.

*Alternative:* a dedicated `TeacherGroupSelector` component. Rejected — it would duplicate the atom wiring, the auto-select effect, and the label/placeholder logic that admins already use, creating a second path to the same state.

### D2 — Key the feed messages query on the group and clear the atom on switch

Add `groupID` (and `userID`) to `useGetUserFeedMessages`'s `queryKey`, so a group switch is a cache-keyed fetch rather than a refetch of a shared key, and clear `groupMessagesAtom` when `contextGroupValue` changes so the previous group's rows cannot render while the new group loads. `FeedGroup`'s manual `refetchMessages()` effect then becomes redundant and is removed.

*Alternatives:*
- Keep the static key and add `placeholderData` — rejected; more moving parts for the same outcome, and the stale atom write still needs handling.
- Scope filtering client-side over a merged fetch — rejected; fetches other groups' messages unnecessarily and fights the existing RLS-scoped query.

Tasks and reports need no equivalent change: `['tasks','group',groupId]` and `['reports',groupId,childId,includeAllChildren]` already key on the group.

### D3 — Reconcile the persisted context in `UserHydrator`, once, role-agnostically

Once the role's options query resolves, reconcile the stored selection against the options actually offered: if the resolved key is not among them (including the `'all'` fallback and the empty value), fall back to the first option; if there are no options at all, clear via `RESET`. `groupContextSelectedAtom` already accepts `RESET`, so no new atom API is needed.

This is required for correctness, not tidiness: `tasks` and `daily_reports` SELECT policies grant any `is_staff` user access regardless of `group_teachers` membership, so a stale `groupContext` in `localStorage` keeps returning another group's rows to a teacher who has since been unassigned. Doing it once in `UserHydrator` applies to admins and parents for free.

**Why the root and not the Feed.** The first draft reconciled inside `FeedUser`, next to the existing auto-select effect. That is wrong, and CI caught it: the group context is *app-wide* state — `MessageInput` reads it to tag a teacher's outgoing message, and the feed reads it to scope queries — so reconciling it in a component that only mounts on `/feed` leaves it unset for a teacher who navigates straight to `/messages`, where D5's guard then correctly refuses to send. `UserHydrator` is mounted in the root `providers.tsx`, so establishing the context there means a teacher always has one when they have groups, and D5's guard fires only for a genuinely group-less teacher.

The reconcile itself is a pure function — `reconcileGroupContextSelection(selection, optionKeys)` in `src/utils/jotai/index.ts`, returning `keep` / `clear` / `select` — so the branching rules are unit-testable without mounting a component.

One prerequisite this decision depends on: an empty option list must mean "this user genuinely has no groups", never "still loading". `UserHydrator` previously wrote `[]` mid-load (`Array.isArray(undefined)` → `[]`), which made those two states indistinguishable. Each role branch in `buildAndSetOptions` now returns early while its query `isPending`, establishing that invariant at the source.

*Alternative:* tighten `staff_or_guardian_select_tasks` / `staff_or_guardian_select_daily_reports` to require `group_teachers` membership. Rejected for this change — it is a migration with a wider blast radius (attendance and report visibility share the same helpers), and the app already treats the client option list as the source of truth for every role.

### D4 — Keep single-select; no aggregate mode

`getGroupContextValue` collapses a `Selection` to exactly one key, and `getFeedUserMessages` ORs that one key with `group_id.is.null`. An aggregate would require the query to accept a set of groups plus a different feed/empty-state model. The `ALL_SELECTION_STORAGE_MARKER` branch in `getGroupContextValue` stays unused; D3 treats an `'all'` stored value as invalid and reconciles it away.

### D5 — Guard the teacher send path against an empty group context

`MessageInput` casts `groupContextId as string` into `messages.group_id`. With reconciliation in place, a teacher assigned to zero groups ends with an empty context, which would produce a uuid parse failure on send. Decision: treat an empty context as "no group to post to" and surface the existing send-error toast instead of firing the insert.

*Alternative:* skip the guard — rejected; it leaves a user-visible failure mode on a path this change makes easier to reach.

### D6 — Leave the realtime handlers alone

INSERT handlers already gate on `groupContextId`, so cross-group inserts are ignored after a switch. The task/report DELETE handlers drop by primary key with no group check, which is harmless because ids are unique — noted, not changed.

## Risks / Trade-offs

- **Previous group's content visible during a switch** → D2: group-keyed query plus clearing `groupMessagesAtom` on group change; the feed shows its spinner instead.
- **A teacher removed from a group keeps reading it** (staff RLS bypass) → D3: reconcile the stored context against the option list on every render of `FeedUser`.
- **A first-ever load shows nothing selected while the groups query is in flight** → the reconcile effect skips when `selectOptions` is empty and re-runs when it resolves, so the first option is applied without a flash of an empty selector. The existing `'all'` string returned by `getSelectedKey()` is treated as "no valid selection", not as a real choice.
- **Changing the messages query key orphans existing cached entries** → one extra fetch per open session after deploy; no correctness impact.
- **Teachers with several groups may expect to see everything at once** → explicitly out of scope (D4); if product wants an aggregate, that is a follow-up change against `getFeedUserMessages`.
- **The send guard changes behavior for a group-less teacher** → previously a silent DB error, now an explicit toast. Improvement, but a visible change.
- **Selector label/placeholder wording is shared with admins** → reuse is intentional; the pluralized keys already handle the teacher case, and no new keys are needed.
- **A failed groups fetch reads as "no groups"** → the reconcile treats an errored fetch the same as a resolved-empty one and resets the selection to "none", so a transient network error on load costs the teacher their group preference (self-healing: the next successful load falls back to the first group, and they can re-pick). Accepted rather than adding a separate "options resolved" readiness signal purely to distinguish error from empty — the security property that motivates D3 still holds, since the point of D3 is that a group the user is *not* in never keeps granting access. Revisit if it proves noisy in practice.