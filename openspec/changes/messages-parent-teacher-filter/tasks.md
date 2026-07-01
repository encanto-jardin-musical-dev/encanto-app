## 1. Database migration

- [ ] 1.1 Create migration `supabase/migrations/<timestamp>_add_child_filter_to_get_profiles_by_guardian.sql` that `create or replace function public.get_profiles_by_guardian(p_child_id uuid default null)` per design.md — default behavior (null) unchanged; when provided, restrict the teacher branch to groups the given child belongs to, re-validated via `child_guardians.guardian_id = auth.uid()`.
- [ ] 1.2 Apply the migration to the linked project (via Supabase MCP `apply_migration`, consistent with how the prior contact-scoping fix was verified — no local Docker stack available).

## 2. Types

- [ ] 2.1 Add `childFilter?: string` to `QueryParams["params"]` in `src/types/hooks.types.ts`.
- [ ] 2.2 Regenerate `src/types/database.types.ts` (via Supabase MCP `generate_typescript_types`) and confirm `get_profiles_by_guardian`'s `Args` type now includes the optional `p_child_id`.

## 3. Query and hook layer

- [ ] 3.1 Update `src/queries/messages/get-parent-user-contacts.ts` — `getParentUserContacts(client, childId?: string)` passes `{ p_child_id: childId ?? null }` to `client.rpc("get_profiles_by_guardian", ...)`.
- [ ] 3.2 Update `src/hooks/UseGetUserContactsQuery.ts` — thread `params.childFilter` through to `getParentUserContacts(client, params.childFilter)` on the parent branch, and include `childFilter` in the query key (`["user-contacts", userID, roleFilter ?? "all", childFilter ?? "all"]`).

## 4. UI

- [ ] 4.1 In `src/components/messages/MessagesContactsList.tsx`, add `useUserChildrenQuery({ params: { userID: user.id }, options: { enabled: user.role === USER_ROLES.PARENT } })` and map results to `{ id, label }` options (child's full name).
- [ ] 4.2 Add `selectedChildId` local state and a `handleChildToggle` callback (toggle-to-clear, mirroring `handleRoleToggle`).
- [ ] 4.3 Render a child-filter `Chip` row (same visual pattern as the existing role-filter row) gated on `user.role === USER_ROLES.PARENT && (children?.length ?? 0) > 1`.
- [ ] 4.4 Pass `childFilter: selectedChildId ?? undefined` into the `useUserContactsQuery` call.
- [ ] 4.5 Add the child-filter chip labels to `messages/es.json` translations (reuse the `MessagesContacts` namespace).

## 5. Verification

- [ ] 5.1 Verify via SQL (`select * from get_profiles_by_guardian(p_child_id => '<child-id>')` impersonating a parent with children in multiple groups) that the result is admins plus only that child's group teachers.
- [ ] 5.2 Verify `get_profiles_by_guardian(p_child_id => '<a child_id not owned by this parent>')` returns admins only, zero teachers.
- [ ] 5.3 Verify `get_profiles_by_guardian()` with no argument still returns the full prior result (regression check against the already-verified default behavior).
- [ ] 5.4 Confirm no child-filter row renders in the running app for a parent with a single child (manual/code inspection, since live browser login isn't available to the agent).
