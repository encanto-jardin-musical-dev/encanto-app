## Context

The admin dashboard exists at `/admin-options` (`src/app/admin-options/page.tsx`) with shortcut tiles and a summary panel; the `admin-options-page` capability is already specced and archived. The tiles currently point at `/admin-options/{entity}` but those screens don't exist. The app uses Next.js 15 App Router + React 19, HeroUI (`@heroui/react`), Heroicons, `next-intl` (single locale `es`), Jotai for client state, and React Query for server state. Established data patterns: query functions under `src/queries/<domain>/` take a `TypedSupabaseClient`; hooks under `src/hooks/Use*Query.ts` wrap them with `createClient()` + React Query (`useInfiniteQuery` already used for message pagination in `UseGetMessagesQuery.ts`, `useMutation` in `UseSendMessageMutation.ts`). Toasts use HeroUI `addToast` with `ToastProvider` already mounted in `providers.tsx`. The floating `ActionButton` is currently a single FAB rendered only inside the feed (`FeedGroup.tsx`); there is no per-screen contextual action button yet. No form library is installed.

Relevant schema (`src/types/database.types.ts`):
- `children`: `id, first_name, last_name, document_type, document_number, gender, birth_date, address, avatar_url`.
- Enums: `document_type` = `cc | rc | ti | passport`; `gender_type` = `male | female`; `guardian_relationship` = `father | mother | other`.
- `child_groups` (child_id, group_id), `groups` (id, name, image_url), `child_guardians` (child_id, guardian_id, relationship), `profiles` (guardian → name, avatar_url; email lives in auth, see Open Questions).
- RLS: `admin_insert_children` / `admin_update_children` gate writes behind `is_admin(auth.uid())`.

## Goals / Non-Goals

**Goals:**
- Rename `/admin-options` → `/admin` and add the nested Children routes per the wireframe.
- Children list: searchable, alphabetical by name, infinite-scroll lazy loading at 20 records/request.
- Children create/edit forms covering ID type+number, names, last names, gender, birth date, address as required fields, with avatar and groups optional; persist `children` and (when selected) `child_groups`. Parents/guardians are not collected during creation.
- Children detail: identity, Groups section, Parents section.
- A reusable contextual action button that changes icon/behavior per screen (Add / Save / Edit).
- Success/error toasts on create and edit; all copy localized.

**Non-Goals:**
- Building Groups, Teachers, or Parents CRUD (their routes stay navigable stubs).
- Parent/guardian creation or assignment from within the child form. Guardians are **optional** and only shown read-only on the detail screen; they are never collected or required during child creation/edit.
- Group creation from within the child form (groups are selected from existing records and are optional).
- Deleting children.
- Role-gating the routes in this change beyond what already governs admin entry (assume admin-only access upstream; can harden later).
- Adding a form-validation library — use controlled state with light inline validation.

## Decisions

### Decision: Rename `/admin-options` to `/admin`
Move `src/app/admin-options/` to `src/app/admin/` and update every reference (`AdminShortcuts.tsx` tile routes → `/admin/{entity}`, `ActionButton.tsx` admin action route → `/admin`, page-title source). Update the `admin-options-page` and `plus-button-actions` specs accordingly.
- **Why:** The wireframe defines `/admin/...` as the canonical structure; aligning now avoids a second migration when the other entities are built.
- **Alternatives considered:** Keep `/admin-options` and nest children under it (rejected — diverges from the agreed path map and the other planned entities). Add a redirect from the old path (optional nicety; not required since the route is new and admin-internal).

### Decision: Paginated, searchable list via `useInfiniteQuery` (keyset by name)
Add `getChildrenPage(client, { search, cursor, pageSize: 20 })` selecting `children` ordered by `last_name, first_name` (alphabetical), filtered with `ilike` on name when a search term is present, limited to 20. Wrap in `useChildrenListQuery` using `useInfiniteQuery`, mirroring `UseGetMessagesQuery`. Use a keyset/range cursor (offset/range or last-name cursor) so each request fetches the next 20. The list component observes a sentinel (IntersectionObserver) to call `fetchNextPage`. Search resets pagination (new query key including the debounced search term).
- **Why:** Matches the existing infinite-query convention; keeps payloads small (20/page); alphabetical order is a stable sort for keyset pagination.
- **Alternatives considered:** Load-all + client filter (rejected — does not scale, violates the 20/request requirement). `range()` offset pagination (acceptable fallback; simpler than keyset and fine for admin volumes — choose offset/range for v1 simplicity, documented in tasks).

### Decision: Contextual action button as a reusable, config-driven component
Introduce `AdminActionButton` (a floating button) that takes an `icon` + `onPress` (or a typed variant: `add | save | edit`) and renders consistently with the existing FAB styling. Each admin screen renders it with the appropriate config: list → Add (Plus icon, navigates to `/admin/children/new`); form → Save (disk icon, submits the form); detail → Edit (pencil icon, navigates to `…/edit`). For the Save variant on forms, the button triggers form submission (shared submit handler / form ref or a context).
- **Why:** Satisfies "the action button should change per screen"; one component keeps styling/placement consistent and is reusable for Groups/Teachers/Parents later.
- **Alternatives considered:** Extending the existing feed `ActionButton` with route-awareness (rejected — that FAB is role/feed-specific and flag-gated; mixing concerns). A global action-button registry atom (possible, but per-screen rendering is simpler and more explicit; revisit if prop-drilling the submit handler gets awkward).

### Decision: Forms with controlled state + HeroUI inputs (no form lib)
Build `ChildForm` with controlled HeroUI components: `Select` for document type and gender (enum-backed), `Input` for numbers/names/address, a date input for birth date, and an optional multi-select for groups (HeroUI `Select` with `selectionMode="multiple"`, options from `getAllGroups`). **Required fields:** document type, document number, first names, last names, gender, birth date, address. **Optional fields:** avatar and groups — submission must succeed with no avatar and no groups selected. Submit maps to a typed `children` Insert/Update plus, only when groups are selected, a set of `child_groups` links. Light required-field validation inline (does not block on avatar/groups). Parents/guardians are **not** part of this form.
- **Why:** No form library is installed; the app already uses controlled HeroUI inputs elsewhere. Enum-backed selects keep values valid. Keeping avatar/groups/guardians out of the required set lets admins create a child quickly with just the core identity data.
- **Alternatives considered:** Adding `react-hook-form` + `zod` (deferred — avoids a new dependency for the first vertical; can be introduced later if forms grow).

### Decision: Avatar upload is optional and deferred for v1
The form renders an avatar control, but uploading an image is **not** required to create or edit a child. For v1, child creation persists `avatar_url = null` when no image is provided; wiring the presigned-upload flow for the avatar can follow in a later change. The list and detail screens render a placeholder when `avatar_url` is absent.
- **Why:** The user confirmed avatar upload is non-blocking for child creation; deferring the upload plumbing keeps this vertical focused and unblocked.
- **Alternatives considered:** Implementing full avatar upload now (deferred — extra storage/presign plumbing not needed for the core flow).

### Decision: Guardians are read-only on detail; optional everywhere
Guardians (`child_guardians` → `profiles`) are displayed only on the detail screen's Parents section and may be empty. They are never collected during create/edit and never required. The list row shows a parent name only when a guardian exists, otherwise it omits/falls back gracefully.
- **Why:** The user confirmed parents/guardians are optional and not blocking for child creation.

### Decision: Create/edit mutations with toasts and cache invalidation
Add `createChild` and `updateChild` query functions and `useCreateChildMutation` / `useUpdateChildMutation` hooks (`useMutation`). On success: invalidate the children list query key (and the detail key on edit), show a success toast, and navigate (create → detail or list; edit → detail). On error: show an error toast and keep the form state. Group links are written by diffing selected vs existing `child_groups`.
- **Why:** Consistent with `UseSendMessageMutation`; toasts already standardized via `addToast`; invalidation keeps the list fresh.

### Decision: New `AdminChildren` i18n namespace
Add an `AdminChildren` block to `messages/es.json` for: list (title, searchPlaceholder, empty, parentLabel), form (screen titles for new/edit, every field label + placeholder, gender/doc-type option labels, save), detail (section headers Groups/Parents, identity labels), and toasts (createSuccess/createError/updateSuccess/updateError). Reuse the existing admin dashboard title key.
- **Why:** Single source of truth for copy; respects the project rule that all titles/labels come from i18n.

## Risks / Trade-offs

- **Route rename breaks existing links/specs** → Mitigation: grep and update every `/admin-options` reference (components, page titles, specs); update `admin-options-page` + `plus-button-actions` deltas; verify `pnpm build` route list shows `/admin/...`.
- **Parent email source** → `profiles` has no email column (email lives in Supabase auth). Since guardians are optional and detail-only, Mitigation: surface email via an existing view/RPC if available, else show guardian name only — email is non-blocking.
- **Avatar upload deferred** → Mitigation: avatar is optional and not required to create a child; v1 persists `avatar_url = null` and renders a placeholder. Upload plumbing is a later change.
- **Keyset vs offset pagination with live search** → Mitigation: use `range()` offset pagination for v1 simplicity and reset on search; document the choice. Ensure deterministic ordering (`last_name, first_name, id`).
- **Contextual Save button wiring** → passing the form submit across to a floating button can get awkward. Mitigation: co-locate the button inside the form screen and call the form's submit handler directly (or a lightweight context); avoid a global registry unless needed.
- **RLS on writes** → Mitigation: rely on existing admin insert/update policies; verify an admin session can create/update and that group links (`child_groups`) are writable by admins (add policy if missing).

## Migration Plan

Additive + a route move; no destructive DB changes:
1. Add the `AdminChildren` i18n namespace (and keep the admin title key).
2. Move `src/app/admin-options/` → `src/app/admin/`; update all `/admin-options` references and the two affected specs.
3. Add children queries + hooks (paginated list, get-by-id-with-relations, create, update, group links).
4. Build components: list + item + search, form, detail (groups/parents sections), and the contextual `AdminActionButton`.
5. Wire screens: `/admin/children`, `/admin/children/new`, `/admin/children/[childID]`, `/admin/children/[childID]/edit`; render the contextual button per screen; add toasts.
6. Verify with `pnpm lint` and `pnpm build`; manually verify list lazy-loading, search, create, edit, detail, and per-screen action button.
Rollback: revert the route move and remove new components/queries/hooks/keys; no DB migration to undo (writes use existing policies).

## Open Questions

- **Pagination strategy**: confirm `range()` offset (simple) is acceptable vs keyset for the children volume.
- **Route access control**: should `/admin/**` be hard-gated to admins in this change, or is upstream entry control sufficient for now?
- **Post-create navigation**: after creating a child, navigate to the new detail page or back to the list?

### Resolved
- **Avatar upload**: optional and deferred — not required to create a child; v1 persists `avatar_url = null` with a placeholder in the UI.
- **Parents/guardians**: optional and detail-only — never collected or required during create/edit; guardian email is non-blocking (show name only if email is unavailable).
