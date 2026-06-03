// TMDB client for Edge Functions. The token stays server-side (Deno.env) — it
// must NEVER reach the app bundle. See `.agents/skills/tmdb/SKILL.md`.

const TMDB_BASE = "https://api.themoviedb.org/3";

// Defaults applied to every request. The app is French.
const DEFAULT_LANGUAGE = "fr-FR";

// Movie detail sub-requests bundled in one call to save quota.
const DETAIL_APPEND = "credits,videos,images,release_dates";

/** Error carrying a TMDB status so the handler can map it to an HTTP code. */
export class TmdbError extends Error {
  status: number;
  statusCode?: number;
  retryAfter?: string | null;

  constructor(
    message: string,
    status: number,
    statusCode?: number,
    retryAfter?: string | null,
  ) {
    super(message);
    this.name = "TmdbError";
    this.status = status;
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}

function authHeaders(): HeadersInit {
  // Prefer the v4 read access token (Bearer). Fall back to the v3 api_key,
  // which is appended as a query param in `tmdbFetch` when no token is set.
  const token = Deno.env.get("TMDB_TOKEN");
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json;charset=utf-8",
    };
  }
  return { "Content-Type": "application/json;charset=utf-8" };
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);

  // Sensible defaults; callers can override.
  if (params.language === undefined) params.language = DEFAULT_LANGUAGE;
  if (params.include_adult === undefined) params.include_adult = false;

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  // v3 fallback when no Bearer token is configured.
  const headers = authHeaders();
  if (!("Authorization" in headers)) {
    const apiKey = Deno.env.get("TMDB_API_KEY");
    if (apiKey) url.searchParams.set("api_key", apiKey);
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    let statusCode: number | undefined;
    let statusMessage = res.statusText;
    try {
      const body = await res.json();
      statusCode = body?.status_code;
      statusMessage = body?.status_message ?? statusMessage;
    } catch {
      // Non-JSON error body — keep the HTTP status text.
    }
    throw new TmdbError(
      statusMessage,
      res.status,
      statusCode,
      res.headers.get("Retry-After"),
    );
  }

  return (await res.json()) as T;
}

/** GET /search/movie — text search. */
export function searchMovies(
  query: string,
  page = 1,
  language?: string,
): Promise<TmdbPagedResult> {
  return tmdbFetch("/search/movie", { query, page, language });
}

/** GET /discover/movie — filter/sort based discovery. `params` is passed through. */
export function discoverMovies(
  params: Record<string, string | number | boolean | undefined>,
): Promise<TmdbPagedResult> {
  return tmdbFetch("/discover/movie", params);
}

/** GET /find/{external_id} — resolve an external id (e.g. imdb_id) to TMDB data. */
export function findByExternalId(
  externalId: string,
  source = "imdb_id",
  language?: string,
): Promise<TmdbFindResult> {
  return tmdbFetch(`/find/${externalId}`, {
    external_source: source,
    language,
  });
}

/** GET /movie/{id} — full detail with bundled sub-requests. */
export function getMovieDetail(
  tmdbId: number,
  language?: string,
): Promise<TmdbMovieDetail> {
  return tmdbFetch(`/movie/${tmdbId}`, {
    language,
    append_to_response: DETAIL_APPEND,
  });
}

// --- Loose TMDB shapes (only the fields we read) -------------------------------

export interface TmdbMovieSummary {
  id: number;
  title?: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
}

export interface TmdbMovieDetail extends TmdbMovieSummary {
  runtime?: number;
  genres?: { id: number; name: string }[];
}

export interface TmdbPagedResult {
  page: number;
  results: TmdbMovieSummary[];
  total_pages: number;
  total_results: number;
}

export interface TmdbFindResult {
  movie_results: TmdbMovieSummary[];
  [key: string]: unknown;
}
