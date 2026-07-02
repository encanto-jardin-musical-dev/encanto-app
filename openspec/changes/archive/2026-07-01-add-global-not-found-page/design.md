## Context

Next.js's App Router picks up `src/app/not-found.tsx` automatically as the catch-all UI for any route segment that doesn't resolve, rendered inside the existing `RootLayout` (so the `encanto` theme class, `Asap` font, and all providers are already applied — no extra wiring needed). There is currently no such file, so unmatched routes fall through to Next's bare default 404. A stray `src/app/error/page.tsx` exists with hardcoded "404 / Page not found" English text at the literal route `/error` — it is not the Next.js 404 convention file, is unstyled/untranslated, and is dead weight once a real `not-found.tsx` exists.

The app already has an established pattern for this kind of state (`src/components/feed/EmptyFeed.tsx`): a centered flex column, a muted `@heroicons/react/24/outline` icon, and `next-intl` copy. Server component pages that need translations and a `NavigationBar`/CTA use `getTranslations` from `next-intl/server` (e.g. `src/app/tasks/page.tsx`), and HeroUI `Button` supports polymorphic `as={Link}` for a real `<a>`-backed navigation button (already used in `src/app/page.tsx`).

## Goals / Non-Goals

**Goals:**
- Any unmatched route renders a themed page (not Next's bare default) with a clear way back into the app.
- The page never blocks navigation — the CTA always works, with no auth check or data fetch that could itself fail.
- Follows existing visual/i18n conventions exactly (no new design system introduced for one page).

**Non-Goals:**
- Not a replacement for `global-error.tsx` — that stays untouched; this only covers "route not found," not thrown runtime errors.
- No attempt to distinguish *why* the route wasn't found (expired link vs. typo vs. deleted resource) — a single generic message is sufficient per the proposal.
- No auth-awareness (e.g. showing a different message/route for logged-out users) — `/feed` is the correct target regardless of auth state, since unauthenticated users hitting `/feed` are already redirected to `/login` by that page's own server-side check (`src/app/feed/@user/page.tsx` pattern), so `not-found.tsx` doesn't need to duplicate that logic.
- Not a blanket audit of every dynamic route — only `src/app/messages/[senderID]/page.tsx` is wired to call `notFound()` in this change, since it was the concrete case reported. Other dynamic routes (e.g. admin detail pages) may have the same class of bug but are out of scope here.

## Decisions

1. **Server Component using `getTranslations` (not `'use client'` + `useTranslations`).**
   Matches the existing pattern in `src/app/tasks/page.tsx`, `attendance/page.tsx`, `daily-report/page.tsx`. `not-found.tsx` needs no client-side state/interactivity — the only interactive element is a navigation `Button as={Link}`, which HeroUI renders as a plain anchor and doesn't require the component itself to be a client component.
   *Alternative considered*: client component with `useTranslations` (like `EmptyFeed.tsx`). Rejected — `EmptyFeed` is client because it's nested inside an already-client parent (`FeedGroup.tsx`); `not-found.tsx` is a top-level route file with no such constraint, so the simpler server pattern applies.

2. **Reuse `EmptyFeed.tsx`'s visual shape (icon + message), not a new bespoke layout.**
   Centered flex column, `@heroicons/react/24/outline` icon (a "page not found"-appropriate icon, e.g. `MapIcon` or `ExclamationTriangleIcon` — final pick left to implementation, any muted outline icon in the existing `text-default-300` style is acceptable), heading + description text, then a primary `Button as={Link} href="/feed" color="primary"`.
   *Alternative considered*: a full illustrated/branded error page. Rejected — no such asset exists in the codebase today and introducing one is disproportionate to the proposal's scope.

3. **Delete `src/app/error/page.tsx` in this change rather than leaving it.**
   It's an actual routable page at `/error` (not a Next.js error-boundary convention file), hardcoded to English "404 / Page not found" with zero styling — a leftover that predates this fix and would confuse future readers about which file is "the" 404 page once `not-found.tsx` exists.
   *Alternative considered*: leave it in place, untouched. Rejected — the proposal already scopes its removal, and keeping two competing "404-ish" pages (one styled/correct, one not) is worse than removing the dead one.

4. **New `NotFound` i18n namespace in `messages/es.json`** with `title`, `description`, and `backToFeed` (or similar) keys, following the existing per-page-namespace convention (`ActionButton`, `UserFeedPage`, etc.).

5. **`not-found.tsx`'s CTA is extracted into a client-component wrapper (`BackToFeedButton.tsx`) rather than rendering HeroUI's `Button`/`Link` inline.**
   HeroUI's `Button` and `Link` are client components; importing them directly into `not-found.tsx` (an async Server Component) breaks the RSC boundary — it surfaced at runtime as `TypeError: createContext only works in Client Components`, not as a build-time or lint error. The fix mirrors an existing codebase pattern: `NavigationBar.tsx` is already a `'use client'` component that receives plain props from server-component pages and renders HeroUI's `Link` internally. `BackToFeedButton.tsx` follows the same shape — a small `'use client'` component taking a translated `label` string prop, keeping `not-found.tsx` itself a Server Component using `getTranslations`.
   *Lesson for future server pages*: any HeroUI interactive component (`Button`, `Link`, etc.) used from a Server Component page must go through a `'use client'` wrapper — this isn't caught by `pnpm lint`, only at runtime.

6. **`src/app/messages/[senderID]/page.tsx` validates `senderID` before rendering, using two checks in sequence:**
   - A UUID-format regex (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`), checked first and cheaply, before any DB round-trip. Postgres throws `invalid input syntax for type uuid` for malformed input against a `uuid` column — without this guard, `getProfileById` re-throws that as an uncaught `Error`, which Next.js surfaces as a raw 500, not a themed 404.
   - If the format is valid, `getProfileById` (existing query in `src/queries/users/get-profile-by-id.ts`) is called with the server-side Supabase client (`@/utils/supabase/server`, not the browser client) and `.maybeSingle()` is used, so a well-formed but nonexistent id resolves to `null` rather than throwing.
   - Either failure calls `notFound()` from `next/navigation`, which renders the `not-found.tsx` page built in this change (no nested `not-found.tsx` exists under `messages/`, so it bubbles to the root one).
   *Alternative considered*: catch-and-rethrow the Postgres error as not-found instead of pre-validating format. Rejected — the regex avoids an unnecessary DB round-trip for obviously-invalid input and keeps the error path explicit rather than relying on parsing a Postgres error message.
   *Note*: `MessagesUserData.tsx`'s existing client-side "unavailable" fallback (for `isError`/missing profile) is left in place — it still covers transient states (e.g. a profile deleted after the page already rendered) that the server-side check at initial load can't catch.

## Risks / Trade-offs

- [Risk] If the icon/copy pick feels generic, it may need future design polish. → Mitigation: matches the existing `EmptyFeed` bar for visual quality in this codebase; not a regression, and easy to swap the icon/copy later since both are isolated to this one file + one i18n namespace.
- [Trade-off] No differentiation between "you typo'd a URL" and "this resource used to exist but was deleted" — acceptable per Non-Goals; the single generic message is standard practice and keeps scope small.
- [Risk] Other dynamic routes with a similar `[id]`-style param and a DB lookup (e.g. admin detail pages) likely share the same latent "malformed id → 500" bug, since it isn't caught by lint or types. → Mitigation: out of scope per Non-Goals above; flagged here for a future pass rather than silently left undocumented.

## Migration Plan

1. Add `messages/es.json` `NotFound` keys.
2. Add `src/app/not-found.tsx` and its `BackToFeedButton.tsx` client-component dependency.
3. Delete `src/app/error/page.tsx`.
4. Add the `senderID` validation + `notFound()` call to `src/app/messages/[senderID]/page.tsx`.
5. No data/schema migration, no feature flag — this is a purely additive UI convention file plus one dead-file removal plus one route-guard addition; safe to ship in one deploy.
6. Rollback: revert the commit — deleting `not-found.tsx` simply reverts to Next's default 404, and reverting the `messages/[senderID]/page.tsx` guard simply restores the prior (buggy) behavior; no other system depends on either change.
