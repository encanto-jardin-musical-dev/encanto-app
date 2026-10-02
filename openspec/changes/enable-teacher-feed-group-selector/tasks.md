## 1. Enable the teacher group selector

- [x] 1.1 In `src/components/feed/FeedUser.tsx`, remove `isDisabled={user.role === USER_ROLES.TEACHER}` from the `Select` and drop the now-unused `USER_ROLES.TEACHER` reference if nothing else in the file needs it
- [x] 1.2 Confirm the `Select` stays single-select (default HeroUI behaviour) so a teacher cannot hold two group keys at once
- [x] 1.3 Verify the label/placeholder still resolve through the teacher branch of `getSelectLabel()` / `getSelectPlaceholder()` (`labels.other` / `placeholders.other`) — no new i18n keys required

## 2. Reconcile the persisted group context

- [x] 2.1 In `src/components/feed/FeedUser.tsx`, replace the `selectOptions.length > 0 && groupContextSelection === undefined` auto-select effect with a reconcile effect
- [x] 2.2 The reconcile effect SHALL treat a stored selection as invalid when its resolved key is not present in `selectOptions`, and SHALL treat the `'all'` fallback string and the empty value as invalid
- [x] 2.3 On an invalid selection with at least one option, set the selection to `new Set([selectOptions[0].key])`
- [x] 2.4 On an invalid selection with zero options, clear it via the existing `RESET` write supported by `groupContextSelectedAtom`
- [x] 2.5 Ensure the effect is a no-op while `selectOptions` is still loading (empty) so it does not clear a valid selection before the groups query resolves, and that it re-runs when options resolve

> **Deviation from design D3 (resolved during implementation).** Tasks 2.4 and 2.5 both key off `selectOptions.length === 0`, which cannot distinguish "still loading" from "genuinely no groups" — `UserHydrator` used to write `[]` mid-load. Resolved by making `[]` mean only "resolved and empty": each role branch in `buildAndSetOptions` now bails while its query `isPending`. The reconcile logic itself is a pure function (`reconcileGroupContextSelection` in `src/utils/jotai/index.ts`) so 2.2–2.4 are unit-testable without a component.

## 3. Re-scope feed queries on group change

- [x] 3.1 In `src/hooks/UseGetUserFeedMessages.ts`, include `userID` and `groupID` in the `queryKey` so a group switch is a cache-keyed fetch instead of a manual refetch of a shared key
- [x] 3.2 In `src/components/feed/FeedGroup.tsx`, clear `groupMessagesAtom` when `contextGroupValue` changes so the previous group's rows cannot render while the new group loads
- [x] 3.3 In `src/components/feed/FeedGroup.tsx`, remove the now-redundant `refetchMessages()` effect keyed on `groupContextId`
- [x] 3.4 Confirm `useGroupTasksQuery` (`['tasks','group',groupId]`) and `useGroupReportsQuery` (`['reports',groupId,childId,includeAllChildren]`) already key on the group — no change needed, leave as is
- [x] 3.5 Confirm the teacher path passes `includeAllChildren` to `useGroupReportsQuery` so switching groups shows every child's report in the selected group

## 4. Guard the teacher send path

- [x] 4.1 In `src/components/messages/MessageInput.tsx`, replace the unchecked `groupContextId as string` in `messages.group_id` with a guard: when a teacher's group context is empty, do not call `sendMessageMutation`
- [x] 4.2 Surface the existing send-error toast (`tToasts('sendError')` / the existing `sendErrorTitle` / `sendErrorDescription` keys) on that path
- [x] 4.3 Confirm a teacher with a valid selection still tags outgoing messages with the selected group id

## 5. Tests

- [x] 5.1 Add unit coverage for the reconcile logic — a stored key absent from the options falls back to the first option; a stored `'all'`/empty value is reconciled; zero options clears via `RESET`
- [x] 5.2 Extend `e2e/fixtures/seed.ts` to assign the fixture teacher to a second group and expose its id on `SeededFixtures` (e.g. `secondGroupId`)
- [x] 5.3 Add a case to `e2e/specs/teacher.spec.ts` asserting the selector is enabled and lists both assigned groups, and that only the selected group's report/task appears after switching _(authored + statically reviewed; executed by CI, see note below)_
- [x] 5.4 Add a case asserting a message sent by the teacher after switching is visible to a guardian of the selected group's group and not to the other group's guardian _(authored + statically reviewed; executed by CI, see note below)_
- [x] 5.5 Run `pnpm test` and `pnpm lint` and confirm both pass _(373 unit tests pass. `pnpm lint` reports 8 errors + 6 warnings that are byte-identical to clean `main` — pre-existing, none introduced here. `tsc --noEmit` and `pnpm build` both clean.)_

> **E2E is verified by CI, not locally.** `.github/workflows/ci.yml` runs `supabase start` + `pnpm test:e2e` on every PR, so 5.3/5.4 are validated there (CI also gets `retries: 2`, which absorbs the flakiness seen when running against a long-lived local dev server). Do not run the Playwright suite against the local stack: a local run leaves `attendance`/`tasks`/`messages` residue that `teardownFixtures` cannot delete (it removes `children`/`groups` *before* those tables and ignores delete errors), which poisons the next seed with a `children_document_type_document_number_key` duplicate. That teardown ordering bug is pre-existing on `main` and does not affect CI (fresh database each run), but it is why local e2e runs are not repeatable.

## 6. Verify

- [ ] 6.1 Manually confirm a multi-group teacher can switch groups in the Feed and the feed re-scopes messages, tasks, and reports with no flash of the previous group's content
- [ ] 6.2 Manually confirm an admin and a parent see no behavior change in the Feed
- [ ] 6.3 Manually confirm a teacher unassigned from their persisted group is reconciled to a current group on next load and no longer sees the stale group's content
- [x] 6.4 Confirm no database migration, RLS policy, or i18n key changes were needed, and that `supabase/migrations/` is untouched _(verified: `git status --short -- supabase/ messages/` is empty)_

> 6.1–6.3 still need a manual browser pass — they are click-through checks against a seeded multi-group teacher.