import { tmdbFetch } from "../client";
import { DEFAULT_LANGUAGE } from "../constants";
import { normalizeSummary } from "../normalize";
import { upsertMovieList } from "../persist";
import type { MediaFilter, MediaType, TmdbMovieSummary, TmdbPagedResult } from "../types";

export async function search(
  filter: MediaFilter,
  query: string,
  page = 1,
  language = DEFAULT_LANGUAGE,
): Promise<TmdbMovieSummary[]> {
  if (!query.trim()) return [];
  const path =
    filter === "all" ? "/search/multi" : filter === "tv" ? "/search/tv" : "/search/movie";
  const result = await tmdbFetch<TmdbPagedResult>(path, {
    query,
    page,
    language,
  });
  const fallbackType: MediaType = filter === "tv" ? "tv" : "movie";
  const normalized = result.results
    .filter((item) => item.media_type !== "person")
    .map((item) => normalizeSummary(item, fallbackType));
  void upsertMovieList(normalized, language).catch((error) =>
    console.error("search cache warm failed", error),
  );
  return normalized;
}
