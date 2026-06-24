## Context

The admin section has four detail screens — group, child, teacher, parent — each rendered under `/admin/{groups|children|teachers|parents}/{id}`. Each screen shows the entities related to the one being viewed using a shared chip primitive:

- `EntityChipSection` (`src/components/common/EntityChipSection.tsx`) renders a titled, wrapping grid with an empty-state label.
- `EntityAvatarChip` (`src/components/common/EntityAvatarChip.tsx`) renders one avatar (image or fallback icon) plus a name label.

Today both are display-only: `EntityAvatarChip` emits plain `<div>`/`<span>` markup with no link or press handler. The related items already carry the `id` needed to build a detail URL (they are used as React keys), and the data hooks/queries already return those ids — no data changes are required.

The app already has a list → detail navigation pattern via `EntityListItemLink`, which wraps a row in a Next.js `<Link>`. This change applies the same mechanism to chips.

The chip sections that need to become navigable:

| Screen | Section component | Chip item → destination |
|---|---|---|
| Group detail | inline in `GroupDetail.tsx` (teachers) | `/admin/teachers/{teacher.id}` |
| Group detail | inline in `GroupDetail.tsx` (children) | `/admin/children/{child.id}` |
| Child detail | `ChildGroupsSection.tsx` | `/admin/groups/{group.id}` |
| Child detail | `ChildParentsSection.tsx` | `/admin/parents/{guardian.id}` |
| Teacher detail | `TeacherGroupsSection.tsx` | `/admin/groups/{group.id}` |
| Parent detail | `ParentChildrenSection.tsx` | `/admin/children/{child.id}` |

## Goals / Non-Goals

**Goals:**
- Allow an admin to tap any related-entity chip on a detail screen and land on that entity's own detail screen.
- Cover all four detail screens and every related-entity section they render.
- Reuse the existing `Link`-based navigation pattern and keep the chips visually identical to today.
- Keep the chip primitive non-interactive when no destination is supplied (backward compatible).

**Non-Goals:**
- No changes to routes, data queries, or the database schema.
- No new visual design for chips beyond the affordance needed for a tappable element (e.g. focus/hover state on the link wrapper).
- No deep-linking, breadcrumb, or navigation-history changes beyond standard `Link` push behavior.
- No changes to the group's teacher `id` semantics (the teacher `id` is the profile id already used by the teacher list links).

## Decisions

### Decision: Add an optional `href` to `EntityAvatarChip` rather than wrapping each chip externally
`EntityAvatarChip` gains an optional `href?: string` prop. When `href` is provided, the chip's content is wrapped in a Next.js `<Link href={href}>`; when omitted, the chip renders exactly as today.

- **Why**: It centralizes the link affordance (focus ring, hover, block/anchor semantics) in one place, keeps every section consistent, and mirrors the existing `EntityListItemLink` pattern. Each section just supplies the `href` for its item type.
- **Alternative considered**: Wrap the result of each `renderChip(...)` in a `<Link>` inside every section/`GroupDetail`. Rejected because it duplicates link markup in 6 places and risks inconsistent styling/accessibility.
- **Alternative considered**: Add an `onPress`/`onClick` with `useRouter().push`. Rejected in favor of `<Link>` for accessibility (real anchors), prefetching, and parity with existing list navigation.

### Decision: Sections own URL construction
Each section (or the inline render in `GroupDetail`) builds the destination URL for its item type and passes it as `href` to `EntityAvatarChip`. The chip primitive stays domain-agnostic.

- **Why**: URL shape is a domain concern; the shared chip should not know about admin routes. This keeps the primitive reusable elsewhere.

### Decision: Preserve empty-state and non-link behavior
`EntityChipSection` is unchanged. When a section has no items it still shows its empty-state label. When `href` is not passed to a chip, the chip is rendered as a non-interactive element exactly as before.

- **Why**: Backward compatibility for any current/future non-navigable usage and no regression to empty states.

## Risks / Trade-offs

- **Teacher chip uses a profile id, child/group/parent chips use their own entity id** → Confirmed consistent with existing list-row links (`teacher.id` from the profile embed is what `/admin/teachers/{id}` already expects). Mitigation: verify each destination route resolves the passed id by manual navigation during implementation.
- **Tappable chips could be mistaken for editable controls** → Mitigation: use only a subtle link affordance (focus ring / pointer cursor); no visual redesign, keeping behavior predictable.
- **A related entity could be stale/deleted, producing a dead link** → Existing detail pages already handle a missing entity with an empty/`—` state, so navigating to a since-deleted id degrades gracefully to that state. No additional handling required.
- **Accessibility** → Wrapping in a real `<Link>` (anchor) provides keyboard focus and activation for free; ensure the label remains the accessible name of the link.
