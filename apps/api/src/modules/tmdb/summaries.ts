import { tmdbFetch } from "./client";
import { DEFAULT_LANGUAGE } from "./constants";
import { normalizeSummary } from "./normalize";
import { upsertMovieList } from "./persist";
import type {
  MediaFilter,
  MediaType,
  TmdbMovieSummary,
  TmdbPagedResult,
  TmdbParams,
} from "./types";

// Shared list fetchers: pull a TMDB page, normalize it, and warm the movies
// cache in the background. Used by discover-feed and recommendations.

export async function discover(
  mediaType: MediaType,
  params: TmdbParams,
): Promise<TmdbMovieSummary[]> {
  const result = await tmdbFetch<TmdbPagedResult>(`/discover/${mediaType}`, params);
  const language = String(params.language ?? DEFAULT_LANGUAGE);
  const normalized = result.results.map((item) => normalizeSummary(item, mediaType));
  void upsertMovieList(normalized, language).catch((error) =>
    console.error("movie list cache warm failed", error),
  );
  return normalized;
}

export async function trending(
  filter: MediaFilter,
  timeWindow: "day" | "week",
  language = DEFAULT_LANGUAGE,
): Promise<TmdbMovieSummary[]> {
  const result = await tmdbFetch<TmdbPagedResult>(`/trending/${filter}/${timeWindow}`, {
    language,
  });
  const fallbackType: MediaType = filter === "tv" ? "tv" : "movie";
  const normalized = result.results
    .filter((item) => item.media_type !== "person")
    .map((item) => normalizeSummary(item, fallbackType));
  void upsertMovieList(normalized, language).catch((error) =>
    console.error("trending cache warm failed", error),
  );
  return normalized;
}
