---
name: tmdb
description: TMDB (The Movie Database) integration for the Seen app — all TMDB access goes through the server-side `tmdb` Edge Function, which proxies TMDB and caches movie details in Supabase to protect the API quota. Use when fetching films (search / discover / find / detail), building movie image URLs, handling TMDB auth/errors, or extending the TMDB cache. Triggers on: TMDB, themoviedb, movie/film data, search films, discover, find by imdb id, poster/backdrop images, movie cache, API quota.
---

# TMDB for Seen

Seen shows films from **TMDB**. To protect the API quota (and cut latency), **every
TMDB call goes through the server-side `tmdb` Edge Function** — the app never calls
TMDB directly. The function proxies TMDB, keeps the token server-side, and caches movie
**details** in the `movies` table (cache-aside). This is the only conformant path: per
the `backend` skill, provider secrets must never reach `EXPO_PUBLIC_*`.

> Read this skill before touching TMDB so you don't re-dig the docs. Deep param tables,
> image config, and error codes live in `references/endpoints.md`.

## Where the code lives

- `supabase/functions/tmdb/index.ts` — the function; routes on `action`.
- `supabase/functions/_shared/tmdb.ts` — TMDB client (Bearer auth, endpoints, errors).
- `supabase/functions/_shared/cache.ts` — `movies` cache helpers (TTL ~30 days).
- `supabase/functions/_shared/supabase-admin.ts` — service-role client for cache writes.
- `supabase/migrations/*_create_movies.sql` — the `movies` table + RLS.

## Auth (critical)

- Base URL: `https://api.themoviedb.org/3`.
- **Preferred (server-side):** v4 *API Read Access Token* as a Bearer header:
  `Authorization: Bearer <TMDB_TOKEN>`.
- **Fallback:** v3 API key as a query param: `?api_key=<TMDB_API_KEY>`.
- Validate a token: `GET /authentication` → `{"success":true,"status_code":1,...}`.
- Secrets stay server-side: local `supabase/functions/.env` (gitignored, see
  `.env.example`); prod `supabase secrets set TMDB_TOKEN=... TMDB_API_KEY=...`.
  **Never** put TMDB keys in `EXPO_PUBLIC_*` or call TMDB from the app.

## Calling the function from the app

```ts
import { supabase } from "@/lib/supabase";

// Text search
const { data } = await supabase.functions.invoke("tmdb", {
  body: { action: "search", query: "dune", page: 1 },
});

// Full detail (cache-aside — served from `movies` when fresh)
await supabase.functions.invoke("tmdb", { body: { action: "movie", tmdb_id: 438631 } });

// Discover (filters/sort passed via `params`)
await supabase.functions.invoke("tmdb", {
  body: { action: "discover", params: { sort_by: "popularity.desc", with_genres: "878" } },
});

// Find by external id (e.g. IMDB)
await supabase.functions.invoke("tmdb", {
  body: { action: "find", external_id: "tt1160419", source: "imdb_id" },
});
```

The app can also read the warm cache directly via RLS:
`supabase.from("movies").select("*")` (authenticated only).

## Endpoints & caching strategy

| action     | TMDB endpoint        | cache behaviour                                            |
| ---------- | -------------------- | --------------------------------------------------------- |
| `movie`    | `/movie/{id}`        | **cache-aside**: serve `movies.detail` if fresh (TTL ~30d), else fetch + upsert |
| `search`   | `/search/movie`      | always TMDB; **warms** `movies` with light rows           |
| `discover` | `/discover/movie`    | always TMDB; warms `movies`                                |
| `find`     | `/find/{external_id}`| always TMDB; warms `movies.movie_results`                 |

- **`append_to_response`** — detail calls bundle sub-requests in one HTTP call
  (`credits,videos,images,release_dates`) to save quota. Add more by extending
  `DETAIL_APPEND` in `_shared/tmdb.ts`.
- **Language** — defaults to `fr-FR` (the app is French); override per request with
  `language`. The cached `movies.language` records what was stored.
- **Daily ID exports** (optional, future) — TMDB publishes daily gzipped id lists at
  `http://files.tmdb.org/p/exports/movie_ids_MM_DD_YYYY.json.gz`; useful for a backfill /
  pre-warm job (e.g. pg_cron), not for on-demand caching.

## Images

TMDB returns **paths** (`poster_path`, `backdrop_path`), not URLs — the app builds them:

```
https://image.tmdb.org/t/p/{size}{path}
// posters:  w92 w154 w185 w342 w500 w780 original
// backdrops: w300 w780 w1280 original
```

`/configuration` (the base URL + size list) is near-static — cache it, don't re-fetch per
request. Use `include_image_language=fr,en,null` to bias localized artwork. Details in
`references/endpoints.md`.

## Errors

TMDB errors carry `{ status_code, status_message }`. The function maps them to HTTP:
401 (bad token), 404 (not found), 429 (rate limited — **respect `Retry-After`**), 422
(validation). See `_shared/tmdb.ts` (`TmdbError`).

## Don'ts

- No TMDB token or `api_key` in the app or in `EXPO_PUBLIC_*`.
- No TMDB calls from the app — always go through the `tmdb` Edge Function.
- Don't overwrite `movies.detail` from list responses (light upserts skip it).
- No schema changes outside a migration.
