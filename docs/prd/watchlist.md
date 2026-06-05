# PRD: Watchlist

> Status: ready-for-agent · iOS-only · Author: synthesized from design session (grill-me)

## Problem Statement

When a Seen user discovers a movie or series they want to watch — browsing Discover, searching, or landing on a media detail screen — there is no way to set it aside for later. Their only persistent relationship with a media item today is a **review** (a rating + optional comment), which inherently means they have *already watched* it. There is no "I want to watch this" state. As a result, intent to watch lives entirely in the user's head: they forget what caught their eye, re-search for the same title repeatedly, and have no single place that answers "what should I watch next?".

## Solution

Introduce a **Watchlist**: a personal, single-state list of movies and series a user intends to watch.

From any media detail screen — or via a native long-press menu on media cards in Discover and search — the user can add the media to their Watchlist or remove it. A new **Watchlist** tab gives the list a permanent home, showing saved media newest-first with an all / movies / series filter that mirrors Discover.

The Watchlist means exactly one thing: *still to watch*. When the user reviews a movie or series (i.e. logs it as watched), it is automatically removed from their Watchlist, so the list never goes stale. The Watchlist is private to its owner for now, with the schema prepared so it can be made publicly visible on a profile later without a breaking migration.

## User Stories

1. As a user browsing a media detail screen, I want to add the movie or series to my Watchlist, so that I can remember to watch it later.
2. As a user on a media detail screen, I want to see whether the media is already on my Watchlist, so that I know its current state without guessing.
3. As a user on a media detail screen, I want to remove the media from my Watchlist, so that I can undo a save I no longer want.
4. As a user, I want adding to my Watchlist to feel instant (optimistic), so that the app feels native and responsive.
5. As a user, I want haptic feedback when I add a media to my Watchlist, so that the action feels confirmed and tactile.
6. As a user browsing Discover, I want to long-press a media card and add it to my Watchlist from a native context menu, so that I can save it without opening its detail screen.
7. As a user looking at search results, I want to long-press a result and add or remove it from my Watchlist, so that saving is frictionless while exploring.
8. As a user, I want a dedicated Watchlist tab, so that I always know where to find what I plan to watch.
9. As a user opening my Watchlist tab, I want to see my saved media as cards with poster, title, and type, so that I can recognize titles at a glance.
10. As a user, I want my Watchlist sorted with the most recently added first, so that what I just saved is easy to find.
11. As a user with a long Watchlist, I want to filter by all / movies / series, so that I can narrow down to the kind of thing I'm in the mood for.
12. As a user, I want to tap a media in my Watchlist to open its detail screen, so that I can decide whether to watch it or read more.
13. As a user, I want to remove a media directly from the Watchlist tab (e.g. swipe to delete), so that I can prune my list quickly.
14. As a user, I want a media to leave my Watchlist automatically when I review it, so that my list only ever shows things I still need to watch.
15. As a user, I want my Watchlist to be private by default, so that my plans are not exposed to others without my consent.
16. As a user with an empty Watchlist, I want a clear empty state that explains how to add media, so that I understand what the tab is for.
17. As a user, I want my Watchlist to persist across sessions and devices (server-backed), so that what I save is never lost.
18. As a user who is not logged in, I want the Watchlist tab and actions to be gated behind auth, so that the feature behaves consistently with the rest of the app.
19. As a user, I want adding the same media twice to be a no-op (idempotent), so that I never get duplicates or errors.
20. As a user, I want adding or removing a media to reflect immediately on every surface (detail, cards, tab), so that the saved state never looks inconsistent.
21. As a user, I want a media I have already watched (reviewed) to still be addable to my Watchlist if I want to rewatch it, so that the feature does not block legitimate intent.
22. As a user, I want my Watchlist to load quickly even when it is large, so that the tab is usable as the list grows.
23. As a user, I want to see how many items are on my Watchlist, so that I have a sense of my backlog. *(nice-to-have; see Out of Scope if deferred)*
24. As a future visitor to another user's public profile, I want to be able to view their Watchlist if they have made it public, so that I can discover what they plan to watch. *(forward-looking; gated by the `visibility` column, not built now)*

## Implementation Decisions

### Domain & vocabulary
- The canonical concept is **Watchlist** — used in the schema, the backend module, the client service, the i18n keys, the tab label, and the action verbs ("Add to Watchlist" / "Remove from Watchlist"). This term is added to the `naming` skill as the single source of truth.
- The Watchlist holds **media** items only: a `movie` or a `tv` series, identified by the existing `(tmdbId, mediaType)` pair — exactly the shape used by `reviews`. The UI renders the `tv` type as "Series" per the naming skill. Episodes are **not** supported (see Out of Scope).
- The Watchlist is a **pure want-to-watch list**: a single state (on the list / not on the list). It is not a multi-status tracker. "Watched" remains derived from the existence of a `review`.

### Database (packages/db/src/schema, packages/db/drizzle)
- New table modeled on `reviews`: one row per `(userId, tmdbId, mediaType)`, with a **unique constraint** on that triple to guarantee idempotency and prevent duplicates.
- Columns: a uuid primary key, `userId` (FK → auth user), `tmdbId`, `mediaType`, an `addedAt` timestamp (drives the default sort), and a `visibility` column **defaulting to private**. The `visibility` column is included now specifically so a future public-profile Watchlist can ship without a breaking migration; no public read path is built in this PRD.
- Media metadata (title, poster, etc.) is **not** denormalized onto the Watchlist row — it is resolved through the existing `movies` table / TMDB module the same way other media surfaces do, keeping the Watchlist row a thin reference.
- Migration generated and applied through the root `db:*` scripts, following the existing numbered SQL migration workflow.

### Auto-removal on review (cross-feature interaction)
- When a `review` is created for a movie or series, any matching Watchlist row for that user is removed **in the same transaction** as the review upsert. This is enforced **server-side in the review-upsert path** (the only writer of `reviews`), so it holds regardless of client and cannot drift.
- The removal fires only on **movie/series reviews** (the `reviews` table), **not** on `episode_reviews`: reviewing a single episode does not mean the whole series has been watched, so it must not clear the series from the Watchlist.
- Adding a media that the user has already reviewed is still permitted (rewatch intent); only the act of writing a review triggers removal.

### Backend module (apps/api/src/modules/watchlist), mirroring `reviews`
- New Elysia controller mounted in the main `apiRouter`, prefix `/watchlist`, behind `authGuard`. All routes are auth-gated and always scoped to the session `user` — there is no path by which one user reads another's Watchlist in this PRD.
- Route surface:
  - `PUT /watchlist/my` — add the current media to the watchlist; idempotent via `onConflictDoNothing`/`onConflictDoUpdate`. Body carries `{ tmdb_id, media_type }`.
  - `DELETE /watchlist/my` — remove the current media; no-op if absent. Identified by query `{ tmdbId, mediaType }`.
  - `GET /watchlist/my` — **membership check** for a single media `{ tmdbId, mediaType }`, returns the item or null. This feeds the detail-screen toggle so it knows the current saved state (mirrors `reviews` `GET /my`).
  - `GET /watchlist` — the list: returns the session user's saved media, newest-`addedAt` first, optional `mediaType` filter, **paginated** following the `reviews` `ListQuery` cursor/limit pattern.
- `model.ts` defines Elysia type models (`watchlist.Item`, `watchlist.Input`, `watchlist.MediaRefQuery`, `watchlist.ListQuery`) and the response shapes. Handlers split into `mutations/` (add, remove) and `queries/` (list, get) per the module convention. DB-row → API-row conversion mirrors `reviews`' `toApiRow`.

### Client service (apps/mobile/src/services/watchlist)
- `types.ts` (`WatchlistItem`, `WatchlistInput`, reuse `MediaRef`), `handlers/` with one thin `eden` wrapper per operation (`add.ts`, `remove.ts`, `list.ts`, `get-my.ts`), and an `index.ts` barrel — exactly the `reviews` service shape.
- Query keys added to `packages/shared/src/query-keys.ts` as `watchlistKeys` (`my(mediaType, tmdbId)`, `list(filter)`).

### Client state & hooks
- **Server state via React Query only.** No persisted Zustand store holds Watchlist data — per the CLAUDE.md boundary rule, the API is the source of truth and Zustand is reserved for UI/offline cache. React Query handles caching and invalidation.
- `hooks/watchlist/use-watchlist.ts` (the list, with filter) and `hooks/watchlist/use-watchlist-membership.ts` (single-media saved state + toggle), following the `useMyReview` pattern: `useQuery` for reads, `useMutation` for add/remove.
- **Optimistic** add/remove: the mutation updates the cache immediately and rolls back on error. On success it invalidates the list query and the membership query so all surfaces converge.
- Reviewing a media must also invalidate that media's Watchlist membership query (so the auto-removal reflects on the client without a manual refresh).

### UI surfaces
- **New `Watchlist` NativeTab** added to `app-tabs.tsx`, with a `(tabs)/watchlist/` route group. The route file is a thin wrapper rendering a new `components/screens/watchlist.tsx` screen (named export `Watchlist`), per the screens-vs-routes convention. Tab switches use the existing `screenListeners` haptics wiring.
- The Watchlist screen renders saved media as cards (reusing the existing media-card component), a segmented all / movies / series filter matching Discover, an **empty state**, and **swipe-to-remove** (`hapticDelete`).
- **Media detail**: a Watchlist toggle control (bookmark affordance), reflecting membership state, firing `hapticTap` on add. Wired through the media-detail view-model alongside the existing review hooks.
- **Media cards** in Discover and search gain a native iOS **long-press context menu** with "Add to Watchlist" / "Remove from Watchlist". No visible layout change to the card grid.
- New i18n keys under a `watchlist` namespace in `src/lib/i18n/locales/en.ts` (tab label, add/remove verbs, empty state, filter labels). User-facing text in English.

### UI build rules
- All new UI is built SwiftUI-first via `@expo/ui/swift-ui` per the `expo-ui-swiftui` skill (`<Host>` with `matchContents` + explicit `ignoreSafeArea`, centralized wrappers, platform colors), falling back to RN views only where no native equivalent exists. Haptics go through the semantic helpers in `src/lib/haptics.ts`.

## Testing Decisions

- **What makes a good test here:** assert external, user-observable behavior at the highest seam — never implementation details. For the Watchlist that means: adding then listing returns the item; adding twice yields one item (idempotency); removing makes it absent; creating a movie/series review removes the matching Watchlist row; creating an *episode* review does **not**; the list endpoint only ever returns the session user's rows; the type filter and newest-first ordering are honored.
- **Modules to test:** the backend `watchlist` module (the add/remove/list/membership endpoints) and the review-upsert auto-removal interaction are the primary seams. These are pure request→response behaviors and the cleanest thing to exercise.
- **Prior art:** mirror whatever exercises the `reviews` and `episode-reviews` modules — they have the same controller/model/handler shape and the same auth-guarded request surface, so the Watchlist tests should look structurally identical.
- **Reality note:** the repo currently has **no test framework wired up** ("There is no test framework wired up"). Until one exists, verification is manual (simulator walkthrough of each user story) plus `bunx tsc --noEmit` and `bun run lint`. The seams above are deliberately drawn at the API boundary so that, when a framework lands, the feature is testable without refactoring.

## Out of Scope

- **Episodes on the Watchlist.** The original request mentioned saving an episode; this is explicitly deferred. Episodes use a `(seriesTmdbId, seasonNumber, episodeNumber)` triple and would require a polymorphic table, episode-detail affordances, and series-vs-episode overlap rules. The series can be watchlisted; individual episodes cannot.
- **Multi-status tracking** (want-to-watch / watching / watched). The Watchlist is single-state; "watched" stays derived from `reviews`.
- **Public / social Watchlists.** Viewing another user's Watchlist, profile integration, and any public read path are not built. The `visibility` column is added now only to keep that future non-breaking.
- **Manual reordering** of the list (no position column, no drag UI) and **multiple sort options** beyond newest-first.
- **Visible bookmark buttons overlaid on cards** — saving from cards is via the long-press context menu only.
- **Notifications / reminders** ("this is releasing soon", "you've had this for a while").
- **Android and web.** iOS-only, per project rules.

## Further Notes

- The auto-removal interaction is the one cross-feature coupling point and the highest-risk piece: it must live in the review-upsert path (or an equivalent transactional mechanism such as a DB trigger on `reviews`, consistent with the existing trigger-based stats maintenance) so it cannot be bypassed by a future second writer, and it must be scoped to movie/series reviews only.
- A Watchlist count badge (story 23) is a small nice-to-have that can ride along if cheap, but is not required for the feature to ship.
- Because adding an already-reviewed media is allowed but reviewing removes it, the only mildly surprising edge case is: add → review (removed) → add again (stays, since no new review event). This is acceptable and intentional.
