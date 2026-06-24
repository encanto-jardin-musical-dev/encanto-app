## 1. Make the shared chip navigable

- [x] 1.1 Add an optional `href?: string` prop to `EntityAvatarChip` (`src/components/common/EntityAvatarChip.tsx`)
- [x] 1.2 When `href` is provided, wrap the chip content in a Next.js `<Link href={href}>` (import from `next/link`); when omitted, render the existing markup unchanged
- [x] 1.3 Ensure the link wrapper preserves layout (block/anchor) and exposes the `label` as the accessible name, with a subtle focus/hover affordance and no visual redesign of the chip

## 2. Wire group detail navigation

- [x] 2.1 In `src/components/admin/groups/GroupDetail.tsx`, pass `href={`/admin/teachers/${teacher.id}`}` to the teacher `EntityAvatarChip`
- [x] 2.2 In `GroupDetail.tsx`, pass `href={`/admin/children/${child.id}`}` to the child `EntityAvatarChip`

## 3. Wire child detail navigation

- [x] 3.1 In `src/components/admin/children/ChildGroupsSection.tsx`, pass `href={`/admin/groups/${group.id}`}` to the group `EntityAvatarChip`
- [x] 3.2 In `src/components/admin/children/ChildParentsSection.tsx`, pass `href={`/admin/parents/${guardian.id}`}` to the guardian `EntityAvatarChip`

## 4. Wire teacher detail navigation

- [x] 4.1 In `src/components/admin/teachers/TeacherGroupsSection.tsx`, pass `href={`/admin/groups/${group.id}`}` to the group `EntityAvatarChip`

## 5. Wire parent detail navigation

- [x] 5.1 In `src/components/admin/parents/ParentChildrenSection.tsx`, pass `href={`/admin/children/${child.id}`}` to the child `EntityAvatarChip`

## 6. Verify

- [x] 6.1 Run `pnpm lint` and resolve any issues introduced by the changes
- [x] 6.2 Run `pnpm build` to confirm the app type-checks and compiles
- [x] 6.3 Manually verify each navigation path: group→teacher, group→child, child→group, child→parent, teacher→group, parent→child lands on the correct detail screen
- [x] 6.4 Confirm empty related sets still show their empty-state label and that chips without an `href` (if any) remain non-interactive
