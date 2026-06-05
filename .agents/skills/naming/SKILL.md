---
name: naming
description: Canonical nomenclature and file-architecture conventions for the Seen app — the ONE source of truth for which word to use for each domain concept (media vs movie vs title, tv vs series vs show, rating vs review vs note) and where every kind of file lives (screens, services, hooks, stores, types). Use whenever naming or renaming anything: a file, folder, type, interface, function, hook, store, store action, DB table/column, locale key, or user-facing string; when adding a screen/service/hook/feature; or when you spot two words for the same concept and need to know which one wins. Read this BEFORE inventing a name.
---

# Naming & file architecture for Seen

The codebase accumulated **several words for the same concept** (media/movie/title, tv/series/show, rating/review/note) and **inconsistent file layout**. This skill is the single source of truth that ends that. When a name here conflicts with existing code, **this skill wins** — migrate the old name when you next touch that code (don't do silent unrelated mass-renames, but never add a *new* usage of a forbidden word).

Two parts: **(1) the vocabulary glossary** (which word) and **(2) file & folder architecture** (where it lives, how it's named).

---

## 1. Vocabulary glossary

For every concept there is **one canonical word**. The others are **forbidden** — do not introduce them in identifiers, filenames, types, or new code. Some are allowed in one layer only (noted).

### Content (a movie or a series)

| Concept | ✅ Canonical | ❌ Forbidden / wrong layer |
|---|---|---|
| Umbrella for "a movie or a series" | **`media`** (`Media`, `MediaType`, `media-detail`, `services/media`) | `title`, `film`, `content`, and `movie` used as the umbrella |
| The discriminant type | **`MediaType = 'movie' \| 'tv'`** (TMDB-native values) | `'series'`, `'show'`, `'film'` as a type value |
| A theatrical film specifically | **`movie`** (only when contrasting with tv) | `film` |
| A television series specifically | **`tv`** in code/types (matches TMDB `media_type`) | `show`, `series` **in code** |
| The **user-facing label** for `tv` | **"Series"** (strings only) | "TV", "Show" in UI copy |

- `media` is the umbrella; `MediaType` is `'movie' | 'tv'`. The pair is intentional: code/types/TMDB use **`tv`**, the rendered UI string says **"Series"**. Never let `'series'` become a type value or a filename, and never render "tv"/"TV" to the user.
- `MediaType` already exists in `@/lib/tmdb` — import it, don't redefine.
- **Kill `film`** entirely (it's a stale leftover, incl. in older docs/examples). It's `movie` (specific) or `media` (umbrella).

### Episodes & seasons

| Concept | ✅ Canonical |
|---|---|
| A TV episode | **`episode`** |
| A season | **`season`** |
| Episode belongs to a `tv` media — never to a "show"/"series" identifier | use `media` (type `tv`) + `season` + `episode` |

### Ratings & reviews (distinct concepts — keep them separate)

| Concept | ✅ Canonical | ❌ Forbidden |
|---|---|---|
| A numeric star score (0–5) | **`rating`** (number) | `note`, `score`, `stars` (as the data name) |
| A user's written entry (text + their rating + author) | **`review`** | `comment`, `critique` |
| The act of saving a review | **`review`** verb / `saveReview` | — |

- **`note` is banned.** It's the French word for "rating" leaking in. The TMDB external rating is also never surfaced (see the `tmdb` skill / memory) — so neither the word nor the value appears in the front end.
- `rating` = the number. `review` = the record `{ rating, text, author, ... }`. A review *has* a rating; they are not synonyms. Don't name a star-only thing a "review", and don't name a text entry a "rating".

### People & accounts

| Concept | ✅ Canonical |
|---|---|
| The public-facing person record (name, avatar, activity) | **`profile`** (`profiles` table, `services/profiles`) |
| The authenticated identity / Better Auth user | **`user`** (from `useAuthContext()`) |
| Account-level destructive ops (delete account) | **`account`** (e.g. `deleteAccount`) — only for auth/account lifecycle |

Don't use `user` for profile data or `profile` for the auth session. `user` = who is logged in; `profile` = the editable public record in our DB.

---

## 2. File & folder architecture

Follows the global + project `CLAUDE.md` rules (one primary export per file, kebab-case, group siblings into folders, no duplication). This section pins the **concrete Seen layout** so names are predictable.

### Casing rules (no exceptions)

| Thing | Convention | Example |
|---|---|---|
| Files & folders | **kebab-case** | `media-detail/`, `use-my-review.ts` |
| Components | PascalCase export, kebab file | `MediaActions` in `media-actions.tsx` |
| Hooks | `use<Thing>` export, `use-<thing>` file | `useMyReview` in `use-my-review.ts` |
| Types / interfaces | PascalCase | `Media`, `MediaType`, `Review`, `Profile` |
| Functions / vars | camelCase | `saveReview`, `mediaId` |
| Store actions | camelCase + **`Action`** suffix | `addReviewAction` |
| DB tables / columns | **snake_case** | `episode_reviews`, `air_date` |
| Locale keys | camelCase, grouped | `mediaDetail`, `noReviewsYet` |

### Where each kind of file lives

```
src/
  app/<group>/...           # routes ONLY — thin default export rendering a screen (no UI)
  components/
    screens/<screen>/        # a screen's UI+logic; folder w/ index.tsx once it has >1 file
      <screen>.tsx           # ...or a single flat file if it's one file
    <feature>/               # shared (non-screen) feature components
    ui/                      # reusable primitives (Button, Text, StarRating, Input)
  hooks/
    <feature>/use-*.ts       # 2+ related hooks → a feature folder (profiles/, reviews/, tmdb/)
    use-*.ts                 # one-off hooks stay flat
  services/
    core/                    # shared client/data plumbing
    <feature>/
      handlers/              # one handler per file (API-backed user data)
      types.ts               # feature's data types
  store/use-<feature>-store.ts
  lib/  constants/  providers/  types/
apps/api/src/modules/<feature>/ # server logic and API routes
packages/db/
  src/schema/                 # Drizzle schema
  drizzle/                    # SQL migrations
```

### File-name patterns (the suffix vocabulary)

A filename is `<concept>-<role>.tsx`, where `<concept>` uses the §1 vocabulary and `<role>` is one of the canonical suffixes below. **Don't invent a new role suffix** when one of these fits; one role = one suffix everywhere.

| Suffix / pattern | Kind of file | Example |
|---|---|---|
| `index.tsx` / `index.ts` | the folder's entry / composition root (a screen folder, or a service barrel) | `screens/media-detail/index.tsx`, `services/reviews/index.ts` |
| `types.ts` | the folder's own types (one per feature folder) | `services/reviews/types.ts` |
| `utils.ts` | the folder's file-local helpers (only if shared by ≥2 siblings) | `screens/media-detail/utils.ts` |
| `use-<thing>.ts` | a hook | `use-my-review.ts` |
| `use-<screen>-view-model.ts` | a screen's view-model hook (state+logic for that screen) | `use-media-detail-view-model.ts` |
| `use-<thing>-controller.ts` | a controller hook driving a sheet/form | `use-review-controller.ts` |
| `use-<feature>-store.ts` | a Zustand store | `use-accent-color-store.ts` |
| `use-<feature>-context.tsx` | a context hook | `use-auth-context.tsx` |
| `<feature>-provider.tsx` | a React provider | `auth-provider.tsx` |
| `<thing>-section.tsx` | a section block inside a screen | `cast-section.tsx`, `overview-section.tsx` |
| `<thing>-card.tsx` | a card component | `review-card.tsx` |
| `<thing>-row.tsx` / `-rows` builder | a list row / a row-builder | `info-row.tsx`, `build-episode-info-rows.ts` |
| `<thing>-header.tsx` | a header component | `media-parallax-header.tsx` |
| `<thing>-actions.tsx` | the action buttons cluster for a thing | `media-actions.tsx` |
| `<thing>-form.tsx` | an input form | `review-form.tsx` |
| `<thing>-container.tsx` | a container/wrapper component | `review-sheet-container.tsx` |
| `build-<thing>.ts` | a pure builder/transform helper | `build-episode-info-rows.ts` |
| **verb**`.ts` (in `handlers/`) | one data operation per file | `upsert.ts`, `list.ts`, `delete.ts`, `stats.ts`, `get-my-review.ts` |

Notes:
- **Service handlers are verb-named, not noun-named**: `handlers/upsert.ts`, `handlers/list.ts`, `handlers/delete.ts` — one API operation per file, re-exported from the feature's `index.ts`. Don't bundle them into one `reviews.ts`.
- **No `-screen` suffix on screen files** — the screen folder/file is the bare feature name (`media-detail`, not `media-detail-screen`); only route files in `app/` add route config.
- **A file's `<concept>` must match its data.** A card showing a review is `review-card.tsx` (not `movie-card.tsx`); a section of media info is media-named.
- Platform files: prefer `<name>.ios.tsx` for native-only variants. **Do not add new `.web.*` files** (web isn't a target).

Rules that are easy to get wrong:

- **Screen names use the canonical vocabulary.** A screen for a movie-or-series is `media-detail` (✅ exists), not `movie-detail`/`title-detail`. An episode screen is `episode-detail`.
- **Feature folders are named after the canonical concept**, pluralized for the data layer: `services/reviews`, `services/episode-reviews`, `services/profiles`, `hooks/reviews`, `hooks/profiles`, `hooks/tmdb`.
- **Mobile data access = `services/<feature>/handlers/`** for user data — call the existing API clients there, not from random components. Server logic / AI / third-party calls live in `apps/api`. (See the `backend` skill.)
- **Singular vs plural:** type/interface = singular (`Review`); table, service folder, and hooks folder = plural (`reviews`). A hook returning one thing is singular (`useMyReview`); a list is plural (`useMediaReviews`).

---

## 3. Known divergences to migrate (found in-repo)

These already violate the rules above. Don't add to them; fix when you touch the area.

| Current | → Canonical | Why |
|---|---|---|
| `screens/review-sheet/` **and** `screens/reviews-sheet/` (differ by one letter) | `review-compose-sheet/` (write one review) and `reviews-list-sheet/` (read all reviews) | The singular/plural collision is unreadable; name by intent (compose vs list). |
| `MovieReviewStats`, `MovieReviewsPage` (in `services/reviews/types.ts`, next to `MediaRef`) | `MediaReviewStats`, `MediaReviewsPage` | Reviews attach to any media, not just movies; matches `MediaRef` in the same file. |
| `hooks/reviews/use-movie-reviews.ts` | `use-media-reviews.ts` | Same — it's media reviews. |
| `hooks/reviews/use-series-episode-ratings.ts` | `use-tv-episode-ratings.ts` (or `use-episode-ratings.ts`) | `series` isn't a code word; `tv` is. |
| any `note` / `film` identifier or string | `rating` / (`movie`\|`media`) | Banned words. |
| `movies` table storing both movies and tv | tolerated for now; new content tables use `media`. **Do not rename a live table** without a data+RLS migration. | Heavy migration; only the word in *code* must be `media`. |

---

## Quick decision checklist

Before naming anything, ask:

1. Is it the umbrella concept? → **`media`** (type `MediaType = 'movie' \| 'tv'`).
2. Specifically a film? → `movie`. Specifically a series? → `tv` in code, **"Series"** in UI.
3. A number of stars? → `rating`. A written entry? → `review`. Never `note`.
4. The logged-in identity? → `user`. The public record? → `profile`.
5. Right folder? Route → `app/`. Screen → `components/screens/<screen>/`. User-data access → `services/<feature>/handlers/`. Hook → `hooks/<feature>/`.
6. Casing matches the table in §2?

If two words exist for one thing and it's not covered here, pick one, use it everywhere, and **add it to this file** so the next person inherits the decision.
