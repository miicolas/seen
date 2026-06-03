# TMDB endpoints — reference

Base URL: `https://api.themoviedb.org/3`. Auth: `Authorization: Bearer <TMDB_TOKEN>`
(preferred) or `?api_key=<TMDB_API_KEY>`. Docs: https://developer.themoviedb.org/reference

## Finding data — the three ways

- **`/search/movie`** — text search; matches original, translated, and alternative titles.
- **`/discover/movie`** — filter/sort by ratings, genres, dates, providers, etc.
- **`/find/{external_id}`** — resolve an external id (IMDB, TVDB…) to TMDB entities.

## `GET /search/movie`

| param           | notes                                          |
| --------------- | ---------------------------------------------- |
| `query`         | required, URL-encoded                          |
| `page`          | 1–500, default 1                               |
| `language`      | e.g. `fr-FR` (default in Seen)                 |
| `include_adult` | default `false` in Seen                        |
| `year` / `primary_release_year` | optional disambiguation        |
| `region`        | ISO-3166-1 to bias release filtering           |

Response: `{ page, results[], total_pages, total_results }`.

## `GET /discover/movie`

Common params (all optional; pass via the function's `params`):

| param                         | example                         |
| ----------------------------- | ------------------------------- |
| `sort_by`                     | `popularity.desc`, `vote_average.desc`, `primary_release_date.desc` |
| `with_genres` / `without_genres` | `878,12` (comma = AND, pipe `|` = OR) |
| `primary_release_year`        | `2024`                          |
| `primary_release_date.gte/lte`| `2024-01-01`                    |
| `vote_average.gte/lte`        | `7.5`                           |
| `vote_count.gte`              | `100` (avoid low-vote noise)    |
| `with_runtime.gte/lte`        | minutes                         |
| `with_original_language`      | `en`, `fr`                      |
| `with_watch_providers` + `watch_region` | provider id + `FR`    |
| `page`                        | 1–500                           |

## `GET /find/{external_id}`

| param             | notes                                                    |
| ----------------- | -------------------------------------------------------- |
| `external_source` | `imdb_id` (default in Seen), `tvdb_id`, `wikidata_id`, … |
| `language`        | optional                                                 |

Response groups results by type: `movie_results`, `tv_results`, `person_results`, etc.

## `GET /movie/{movie_id}`

| param                  | notes                                                       |
| ---------------------- | ----------------------------------------------------------- |
| `language`             | `fr-FR`                                                     |
| `append_to_response`   | bundle sub-requests in ONE call to save quota               |
| `include_image_language` | with `append_to_response=images`, e.g. `fr,en,null`       |

Seen bundles `credits,videos,images,release_dates`. `append_to_response` accepts a
comma-separated list of sub-resources (`credits`, `videos`, `images`, `recommendations`,
`similar`, `keywords`, `release_dates`, `watch/providers`, …). Each appended resource is
billed as part of the single request.

## Images

Build URLs from paths: `https://image.tmdb.org/t/p/{size}{path}`.

| type     | sizes                                   |
| -------- | --------------------------------------- |
| poster   | `w92 w154 w185 w342 w500 w780 original` |
| backdrop | `w300 w780 w1280 original`              |
| profile  | `w45 w185 h632 original`                |
| logo     | `w45 w92 w154 w185 w300 w500 original`  |

`GET /configuration` returns `images.secure_base_url` + the size lists. It is near-static —
cache it; do not fetch per request. `include_image_language=fr,en,null` filters localized
artwork (`null` keeps textless images).

## Errors

`{ "success": false, "status_code": <int>, "status_message": "<text>" }`

| HTTP | meaning                | handling                                  |
| ---- | ---------------------- | ----------------------------------------- |
| 401  | invalid/missing token  | check `TMDB_TOKEN` / `TMDB_API_KEY`       |
| 404  | resource not found     | surface as not-found                      |
| 422  | invalid parameters     | fix the request                           |
| 429  | rate limited           | **respect `Retry-After`**, back off/retry |

TMDB rate limit is roughly ~50 requests/second; there is no hard daily cap today, but the
`movies` detail cache still removes most repeat calls. Validate a token with
`GET /authentication`.

## Other useful docs

- Append to response: https://developer.themoviedb.org/docs/append-to-response
- Image basics / languages: https://developer.themoviedb.org/docs/image-basics
- Languages: https://developer.themoviedb.org/docs/languages
- Daily ID exports: https://developer.themoviedb.org/docs/daily-id-exports
- Errors: https://developer.themoviedb.org/docs/errors
