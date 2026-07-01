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

## Risks / Trade-offs

- [Risk] If the icon/copy pick feels generic, it may need future design polish. → Mitigation: matches the existing `EmptyFeed` bar for visual quality in this codebase; not a regression, and easy to swap the icon/copy later since both are isolated to this one file + one i18n namespace.
- [Trade-off] No differentiation between "you typo'd a URL" and "this resource used to exist but was deleted" — acceptable per Non-Goals; the single generic message is standard practice and keeps scope small.

## Migration Plan

1. Add `messages/es.json` `NotFound` keys.
2. Add `src/app/not-found.tsx`.
3. Delete `src/app/error/page.tsx`.
4. No data/schema migration, no feature flag — this is a purely additive UI convention file plus one dead-file removal; safe to ship in one deploy.
5. Rollback: revert the commit — deleting `not-found.tsx` simply reverts to Next's default 404, no other system depends on this file existing.
