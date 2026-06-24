## Context

The admin Children and Groups modules were built in parallel and share a large amount of duplicated code. A DRY audit found 13 candidates; this design covers the high-value, low-risk subset that pays back immediately and de-risks future entity admins:

- **Link reconciliation**: the "fetch existing → diff add/remove → insert/delete" algorithm appears 3× — `child_groups` and `child_guardians` in `update-child.ts` (lines 34–102) and `group_teachers` in `update-group.ts`. The guardian copy keys only on `guardian_id`, so a changed `relationship` on an existing guardian is silently not re-written — an inconsistency a shared helper can normalize.
- **Storage utils**: `uploadChildAvatar.ts` and `uploadGroupImage.ts` are ~96 lines each and byte-identical apart from bucket name, file label, and error-class name.
- **Image picker**: `ChildForm`/`GroupForm` each carry ~70 lines of identical tri-state (`File | null | undefined`) picker state, handlers, blob-URL cleanup, and circular-picker JSX.
- **Multi-select**: the guardians selector (`ChildForm`) and teachers selector (`GroupForm`) are structurally the same `Select selectionMode="multiple"` plus an orphan-id purge effect — implemented slightly differently today.
- **Leaf UI**: `ConfirmDelete*Modal`, `*SearchBar`, `*List`, `*ListItem`, and the "avatar circle + name" chip/section idiom (appears ~7×) are near-duplicates differing only by namespace, icon, href, or label.

Constraints: HeroUI components, Jotai + React Query conventions, generated DB types in `src/types/database.types.ts`, i18n via `next-intl` namespaces (`AdminChildren`, `AdminGroups`), no test framework. The codebase already has a `src/components/common/` dir with generic `SearchBar`/`UserListItem`, so shared admin pieces have a natural home.

## Goals / Non-Goals

**Goals:**
- Single source of truth for each duplicated concern: reconciliation, image storage, image picker, multi-select, confirm-delete modal, avatar chip/section, search bar, infinite list, list-row link, `getProfilesByRole`.
- Preserve current behavior of every Children/Groups admin flow exactly (a strict refactor).
- Make the abstractions general enough to back a third entity admin without copy-paste.
- Normalize the known inconsistencies (orphan purge, guardian-relationship rewrite) as part of consolidation.

**Non-Goals:**
- No new admin features, screens, or schema/migration changes.
- No change to React Query key strings, route structure, or i18n keys (only how they're passed in).
- Not extracting the lower-value hook-factory pattern (#13) in this change — left as a follow-up.
- No visual redesign; pixel output should match current screens.

## Decisions

### Location & naming
- Shared **UI** lives in `src/components/common/` (reuse the existing folder) with `Entity`-prefixed names: `EntityMultiSelect`, `EntityAvatarChip`, `EntityChipSection`, `EntityListItemLink`, `ImagePicker`, `ConfirmDeleteModal`. Hook `useImagePicker` in `src/hooks/`.
- Shared **query/util** lives in `src/queries/shared/` and `src/utils/`. Rationale: matches existing `src/components/common/` precedent; avoids a brand-new top-level `shared/` tree. *Alternative considered:* a new `src/components/admin/shared/` — rejected because several of these (search bar, list item, modal) are not admin-specific in principle.

### `reconcileLinks` helper (`src/queries/shared/reconcile-links.ts`)
Generic, typed against `Database['public']['Tables']`:
```ts
reconcileLinks(client, {
  table, parentColumn, childColumn,
  parentId,
  desired: T[],
  getKey: (item: T) => string,        // child-column value
  buildRow: (item: T) => Row,         // full insert row
})
```
- Replaces all three reconciliation blocks. Guardians supply `getKey: g => g.guardian_id` and `buildRow: g => ({ child_id, guardian_id, relationship })`.
- Re-used in create queries with `existing = []` (insert-only path) so create/update share one code path.
- **Relationship fix**: because guardians now compare via a stable key but rewrite full rows, the helper SHALL re-sync existing rows whose payload changed. Simplest correct approach: for guardians, treat "exists but row differs" as remove+add, OR upsert the desired set. Decided: helper computes `toAdd`/`toRemove` on `getKey`, and additionally upserts unchanged-key rows when `buildRow` carries extra mutable fields. Kept behind a `mutableFields?` flag so groups/teachers (no extra fields) keep the cheap diff. *Alternative:* always upsert-all — rejected to avoid needless writes and to preserve current group/teacher behavior exactly.

### `createImageStorage` factory (`src/utils/imageStorage.ts`)
```ts
const { ValidationError, upload, getSignedUrl, getSignedUrls } =
  createImageStorage({ bucket, fileLabel });
```
- Exports named singletons `childAvatarStorage` / `groupImageStorage`.
- Existing `uploadChildAvatar.ts` / `uploadGroupImage.ts` become thin re-export shims (keep current import paths working) and are deleted in a later pass once call sites migrate. *Alternative:* delete immediately and update all imports in one commit — acceptable, but shims reduce blast radius per step.
- Keeps the same Spanish error copy, 5 MB limit, JPEG/PNG/WebP allow-list, 1 h TTL.

### `useImagePicker(existingUrl)` + `<ImagePicker>`
- Hook owns tri-state `file: File | null | undefined`, `preview`, blob revoke cleanup, and returns `{ file, preview, pick(), remove(), inputProps }`.
- `<ImagePicker shape="circle"|"square" fallbackIcon labels={{ add, change, remove, label }} />` renders the picker chrome; consumers pass namespace-resolved labels and the icon (`UserCircleIcon` vs `PhotoIcon`). Form state (`avatarFile`/`imageFile`) stays in the form; the picker is controlled.

### `<EntityMultiSelect<T>>`
```tsx
<EntityMultiSelect items selectedIds onChange
  getId getLabel label placeholder purgeOrphans />
```
- Encapsulates the HeroUI `Select selectionMode="multiple"` wiring and the orphan-purge effect (single canonical implementation), eliminating the current divergence between the two selectors.

### Leaf components
- `<ConfirmDeleteModal entityName isOpen isPending onOpenChange onConfirm labels />` — labels resolved by caller from its namespace (`deleteModal.*`).
- `<EntityAvatarChip imageUrl? icon shape size label />` and `<EntityChipSection title emptyLabel items renderChip />` — `GroupDetail`, `ChildParentsSection`, `ChildGroupsSection` become thin compositions.
- `<EntityListItemLink href imageUrl? fallbackIcon title subtitle? />` — backs `ChildListItem`/`GroupListItem`.
- Search bar and infinite list: extract `AdminSearchBar` (debounced `Input`) and a `useInfiniteScrollSentinel` hook + generic list wrapper. The bespoke `*SearchBar`/`*List` files become thin wrappers that inject their hook/namespace, preserving query keys.

### `getProfilesByRole(client, role, { withAvatar? })`
- One query for `profiles` filtered by `role`, ordered `last_name, first_name`. `get-available-parents` (with avatar) and `get-available-teachers` become one-line callers; existing `ParentOption`/`TeacherOption` types kept as aliases.

## Risks / Trade-offs

- **Behavioral drift during extraction** → Mitigation: refactor one concern at a time, each a self-contained task; run `pnpm lint` + `pnpm build` after each; manual regression checklist in tasks covers create/edit/delete + assignment + upload + search + scroll for both entities.
- **Over-generalization (premature abstraction)** → Mitigation: scope is limited to patterns with ≥2 real consumers today; props are minimal and driven by the two existing call sites, not speculative.
- **`reconcileLinks` typing against generated table types is finicky** → Mitigation: keep the generic loose at the row level (`Record<string, unknown>` for `buildRow`) while the consumer-facing wrappers stay strongly typed; verify no `any` leaks per AGENTS.md.
- **Guardian relationship-rewrite is a (small) behavior change** → It fixes a latent bug; called out explicitly so reviewers expect updated rows when only the relationship changes. If undesired, the `mutableFields` flag can be omitted to keep exact old behavior.
- **i18n coupling** → Passing resolved label strings (not `t` itself) into shared components keeps them namespace-agnostic and avoids accidental key removals.

## Migration Plan

1. Land low-risk pure extractions first (`createImageStorage`, `getProfilesByRole`, `AdminSearchBar`) behind shims/wrappers.
2. Extract `reconcileLinks`; migrate `update-child`, `update-group`, `create-child`, `create-group`; verify assignment flows.
3. Extract `useImagePicker` + `ImagePicker`; migrate both forms; verify upload/remove/replace.
4. Extract `EntityMultiSelect`; migrate guardians + teachers selectors.
5. Extract `ConfirmDeleteModal`, `EntityAvatarChip`/`EntityChipSection`, `EntityListItemLink`, infinite-list wrapper; migrate detail/list components.
6. Remove now-unused shims and dead code; final `pnpm lint` + `pnpm build` + full manual regression.

Rollback: each step is independent and revertable; the original files are replaced incrementally, so reverting a single commit restores that concern without affecting the others.

## Open Questions

- Should the shims for `uploadChildAvatar`/`uploadGroupImage` be kept long-term or removed in this change? Defaulting to **remove at the end of this change** once all call sites use the factory.
- Confirm the guardian-relationship rewrite is desired behavior (assumed **yes** — it's a bug fix). If not, drop `mutableFields` to preserve exact current behavior.
