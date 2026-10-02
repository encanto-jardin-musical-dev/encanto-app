## Why

The Feed group selector is hard-disabled for teachers (`FeedUser.tsx` passes `isDisabled={user.role === USER_ROLES.TEACHER}`), so a teacher assigned to several groups is permanently pinned to whichever group happens to be first in their option list. Since a many-to-many `group_teachers` assignment has been supported since `group-multiple-teachers`, this is now a real gap: the teacher only ever sees the messages, tasks, and reports of one group, and every message they send is stamped with that one group id — so parents of their other groups never receive those messages in their own feed.

## What Changes

- **Enable the group selector for teachers.** Remove the role-based `isDisabled` so a teacher's selector lists exactly the groups they are assigned to (`group_teachers`), mirroring the admin selector.
- **Re-scope the whole feed on selection change.** Selecting a group SHALL re-scope feed messages (`group_id.eq.<selected>` plus direct messages), group tasks, and group reports to that group only. The existing `contextGroupValue` atom already drives all three queries and the outgoing-message `group_id`, so this is a matter of making the selection reachable rather than adding new plumbing.
- **Tag outgoing messages with the selected group.** A teacher sending from `/messages` already stamps `group_id` with the current group context; with the selector enabled this becomes the group the teacher actually chose instead of an arbitrary first group.
- **Validate the persisted group context against assigned groups.** The selection is persisted to `localStorage` (`atomWithStorage`). A teacher removed from a group would otherwise keep a stale `groupContext` value, and because `tasks` / `daily_reports` RLS grants read access to any `is_staff` user regardless of group membership, they would keep reading that group. The selection SHALL be reconciled to the first assigned group when the stored value is not among the teacher's options.
- **Single-select preserved.** The selector stays single-select; no cross-group "all groups" aggregate view is introduced in this change.

## Capabilities

### New Capabilities
- `teacher-feed-group-selector`: Teacher-scoped group selection in the Feed — an enabled selector listing the teacher's assigned groups, feed content (messages, tasks, reports) scoped to the selected group, and reconciliation of a persisted group selection that is no longer assigned to the teacher.

### Modified Capabilities
<!-- None. `feed-child-selector`, `feed-tasks`, and `feed-reports` describe parent-facing
     behavior and already speak in terms of "the currently selected group context";
     no requirement in them changes. -->

## Impact

- **Code**
  - `src/components/feed/FeedUser.tsx` — drop `isDisabled`, reconcile the persisted selection.
  - `src/lib/store/common.ts` — no API change; may gain a write-only reset/`RESET` path for reconciliation.
  - `src/components/feed/FeedGroup.tsx` — read-side already keys off `contextGroupValue`; verify messages/tasks/reports refetch and reset on switch.
  - `src/components/messages/MessageInput.tsx` — unchanged; benefits from the corrected group context.
- **Database / RLS** — none. `messages` SELECT is already sender/receiver-scoped; `tasks` and `daily_reports` SELECT already carry an `is_staff` bypass, which is why client-side reconciliation (not a new policy) is what keeps a stale context from leaking a group's data.
- **Data / migrations** — none.
- **i18n** — existing `UserFeedPage.FeedUser` label/placeholder keys already pluralize by option count and apply to the teacher branch; no new keys expected.
- **APIs / dependencies** — none.