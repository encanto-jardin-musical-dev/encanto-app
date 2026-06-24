## 1. Implementation

- [ ] 1.1 Rewrite `src/components/common/UserListItem.tsx`: wrap `EntityListItemLink` in a `<div onClick={handleContactClick}>`, pass `imageUrl={avatar_url}`, `fallbackIcon={UserCircleIcon}`, `title={fullName}`, `subtitle={role}`, `href={/messages/${id}}`; remove HeroUI `<User>` and the `bg-default-100 rounded-lg p-2` wrapper

## 2. Verification

- [ ] 2.1 Manual: contacts list renders with divider-separated rows, no per-row card background, matching the admin entity list style
- [ ] 2.2 Manual: contacts with avatars show photos; contacts without avatars show `UserCircleIcon` fallback
- [ ] 2.3 Manual: tapping a row navigates to the conversation and the header shows the correct name and avatar instantly (no flicker)
- [ ] 2.4 Run `pnpm lint` — no new errors
