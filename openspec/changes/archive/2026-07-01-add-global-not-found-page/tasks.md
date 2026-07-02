## 1. Translations

- [x] 1.1 Add a `NotFound` namespace to `messages/es.json` with `title`, `description`, and `backToFeed` (CTA label) keys, following the existing per-page namespace convention.

## 2. 404 page

- [x] 2.1 Create `src/app/not-found.tsx` as an async Server Component using `getTranslations('NotFound')` (matching the pattern in `src/app/tasks/page.tsx`).
- [x] 2.2 Render the empty-state layout matching `EmptyFeed.tsx`'s visual shape: centered flex column, a muted `@heroicons/react/24/outline` icon, translated title/description text.
- [x] 2.3 Add a HeroUI `Button as={Link} href="/feed" color="primary"` CTA using the `backToFeed` translation key, matching the polymorphic `Button`/`Link` pattern used in `src/app/page.tsx`.

- [x] 2.4 Extract the CTA into a `'use client'` wrapper (`src/components/common/BackToFeedButton.tsx`) rendering HeroUI's `Button as={Link}`, since importing HeroUI's `Button`/`Link` directly into the Server Component `not-found.tsx` breaks the RSC boundary (`createContext` runtime error). Mirrors the existing `NavigationBar.tsx` pattern.

## 3. Cleanup

- [x] 3.1 Delete `src/app/error/page.tsx` (stray, unstyled, hardcoded-English placeholder superseded by `not-found.tsx`).

## 4. Verification

- [x] 4.1 Run `pnpm dev`, navigate to a nonexistent top-level route (e.g. `/this-does-not-exist`), and confirm the themed 404 page renders instead of Next's default 404.
- [x] 4.2 Navigate to a nonexistent nested route (e.g. `/messages/not-a-real-id/extra`) and confirm the same themed 404 page renders.
- [x] 4.3 Click the "back to feed" CTA and confirm it navigates to `/feed`.
- [x] 4.4 Confirm `/error` no longer resolves to the old placeholder page (it should now itself hit the new 404 page, since the route file was deleted).
- [x] 4.5 Run `pnpm lint` to confirm no type/lint errors introduced.

## 5. Message thread route guard

- [x] 5.1 In `src/app/messages/[senderID]/page.tsx`, validate `senderID` against a UUID-format regex before querying; call `notFound()` immediately if it doesn't match (avoids a Postgres `invalid input syntax for type uuid` error surfacing as a raw 500).
- [x] 5.2 For a well-formed `senderID`, look up the profile via `getProfileById` using the server-side Supabase client (`@/utils/supabase/server`); call `notFound()` if no matching profile row exists.
- [x] 5.3 Run `pnpm dev` and confirm `/messages/<malformed-value>` (e.g. the reported `ba91b6f7-d1a4-4c1d-a6be-1ecf18e0ca53123123`) renders the themed 404 page (not a 500).
- [x] 5.4 Confirm `/messages/<well-formed-but-nonexistent-uuid>` (e.g. `00000000-0000-0000-0000-000000000000`) also renders the themed 404 page.
- [x] 5.5 Run `pnpm lint` to confirm no type/lint errors introduced.
