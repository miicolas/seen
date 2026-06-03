const TMDB_BASE = "https://api.themoviedb.org/3";

const DEFAULT_LANGUAGE = "fr-FR";

const DETAIL_APPEND = "credits,videos,images,release_dates";

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

  if (params.language === undefined) params.language = DEFAULT_LANGUAGE;
  if (params.include_adult === undefined) params.include_adult = false;

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

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
      statusMessage = res.statusText;
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

export function searchMovies(
  query: string,
  page = 1,
  language?: string,
): Promise<TmdbPagedResult> {
  return tmdbFetch("/search/movie", { query, page, language });
}

export function searchTv(
  query: string,
  page = 1,
  language?: string,
): Promise<TmdbPagedResult> {
  return tmdbFetch("/search/tv", { query, page, language });
}

export function searchMulti(
  query: string,
  page = 1,
  language?: string,
): Promise<TmdbPagedResult> {
  return tmdbFetch("/search/multi", { query, page, language });
}

export function search(
  filter: "all" | TmdbMediaType,
  query: string,
  page = 1,
  language?: string,
): Promise<TmdbPagedResult> {
  if (filter === "tv") return searchTv(query, page, language);
  if (filter === "movie") return searchMovies(query, page, language);
  return searchMulti(query, page, language);
}

export function discoverMovies(
  params: Record<string, string | number | boolean | undefined>,
): Promise<TmdbPagedResult> {
  return tmdbFetch("/discover/movie", params);
}

export function discoverTv(
  params: Record<string, string | number | boolean | undefined>,
): Promise<TmdbPagedResult> {
  return tmdbFetch("/discover/tv", params);
}

export function discover(
  mediaType: TmdbMediaType,
  params: Record<string, string | number | boolean | undefined>,
): Promise<TmdbPagedResult> {
  return mediaType === "tv" ? discoverTv(params) : discoverMovies(params);
}

export function trending(
  mediaType: "all" | TmdbMediaType,
  timeWindow: "day" | "week",
  language?: string,
): Promise<TmdbPagedResult> {
  return tmdbFetch(`/trending/${mediaType}/${timeWindow}`, { language });
}

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

export function getMovieDetail(
  tmdbId: number,
  language?: string,
): Promise<TmdbMovieDetail> {
  return tmdbFetch(`/movie/${tmdbId}`, {
    language,
    append_to_response: DETAIL_APPEND,
  });
}

export type TmdbMediaType = "movie" | "tv";

export interface TmdbMovieSummary {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  media_type?: TmdbMediaType | "person";
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
