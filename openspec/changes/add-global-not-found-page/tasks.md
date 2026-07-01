## 1. Translations

- [ ] 1.1 Add a `NotFound` namespace to `messages/es.json` with `title`, `description`, and `backToFeed` (CTA label) keys, following the existing per-page namespace convention.

## 2. 404 page

- [ ] 2.1 Create `src/app/not-found.tsx` as an async Server Component using `getTranslations('NotFound')` (matching the pattern in `src/app/tasks/page.tsx`).
- [ ] 2.2 Render the empty-state layout matching `EmptyFeed.tsx`'s visual shape: centered flex column, a muted `@heroicons/react/24/outline` icon, translated title/description text.
- [ ] 2.3 Add a HeroUI `Button as={Link} href="/feed" color="primary"` CTA using the `backToFeed` translation key, matching the polymorphic `Button`/`Link` pattern used in `src/app/page.tsx`.

## 3. Cleanup

- [ ] 3.1 Delete `src/app/error/page.tsx` (stray, unstyled, hardcoded-English placeholder superseded by `not-found.tsx`).

## 4. Verification

- [ ] 4.1 Run `pnpm dev`, navigate to a nonexistent top-level route (e.g. `/this-does-not-exist`), and confirm the themed 404 page renders instead of Next's default 404.
- [ ] 4.2 Navigate to a nonexistent nested route (e.g. `/messages/not-a-real-id/extra`) and confirm the same themed 404 page renders.
- [ ] 4.3 Click the "back to feed" CTA and confirm it navigates to `/feed`.
- [ ] 4.4 Confirm `/error` no longer resolves to the old placeholder page (it should now itself hit the new 404 page, since the route file was deleted).
- [ ] 4.5 Run `pnpm lint` to confirm no type/lint errors introduced.
