---
name: tmdb
description: TMDB (The Movie Database) integration for the Seen app — all TMDB access goes through the server-side API module, which proxies TMDB and keeps tokens server-side. Use when fetching media (search / discover / detail), building movie image URLs, handling TMDB auth/errors, or extending TMDB server handlers. Triggers on: TMDB, themoviedb, movie data, search media, discover, poster/backdrop images, API quota.
---

# TMDB for Seen

Seen shows media from **TMDB**. To protect the API quota and keep credentials private,
**every TMDB call goes through `apps/api/src/modules/tmdb/`** — the app never calls TMDB
directly. The API proxies TMDB and keeps the token server-side. This is the only
conformant path: per the `backend` skill, provider secrets must never reach
`EXPO_PUBLIC_*`.

> Read this skill before touching TMDB so you don't re-dig the docs. Deep param tables,
> image config, and error codes live in `references/endpoints.md`.

## Where the code lives

- `apps/api/src/modules/tmdb/router.ts` — Elysia routes.
- `apps/api/src/modules/tmdb/client.ts` — TMDB client (Bearer auth, endpoints, errors).
- `apps/api/src/modules/tmdb/queries/` — server query handlers.
- `apps/api/src/modules/tmdb/resources/` — TMDB-to-app resource mappers.
- `apps/mobile/src/lib/tmdb/` — mobile wrappers around the API.

## Auth (critical)

- Base URL: `https://api.themoviedb.org/3`.
- **Preferred (server-side):** v4 *API Read Access Token* as a Bearer header:
  `Authorization: Bearer <TMDB_TOKEN>`.
- **Fallback:** v3 API key as a query param: `?api_key=<TMDB_API_KEY>`.
- Validate a token: `GET /authentication` → `{"success":true,"status_code":1,...}`.
- Secrets stay server-side in the API environment.
  **Never** put TMDB keys in `EXPO_PUBLIC_*` or call TMDB from the app.

## Calling the function from the app

```ts
import { getDiscoverFeed, getMovieDetail, searchMedia } from "@/lib/tmdb";

// Text search
const results = await searchMedia("dune", "all", 1);

// Full detail
const detail = await getMovieDetail(438631, "movie");

// Discover
const feed = await getDiscoverFeed("all");
```

## Endpoints

| API route | TMDB endpoint |
| --- | --- |
| `GET /tmdb/search` | `/search/movie` and tv search as requested by filter |
| `GET /tmdb/discover` | discover feed endpoints |
| `GET /tmdb/:mediaType/:tmdbId` | `/movie/{id}` or `/tv/{id}` |
| `GET /tmdb/tv/:seriesId/season/:seasonNumber` | `/tv/{id}/season/{season}` |
| `GET /tmdb/tv/:seriesId/season/:seasonNumber/episode/:episodeNumber` | `/tv/{id}/season/{season}/episode/{episode}` |

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
- No TMDB calls from the app — always go through the API module.
- No schema changes outside a migration.
