import { tmdbFetch } from "../client";
import { DEFAULT_LANGUAGE } from "../constants";
import { hasRating, normalizeSummary } from "../normalize";
import { upsertMovieList } from "../persist";
import type { MediaType, TmdbMovieSummary, TmdbPagedResult } from "../types";

// Per-title recommendation lists barely change; cache them for a day so the
// per-anchor calls made by feed computes are near-free at steady state.
const RECOMMENDATIONS_TTL_SECONDS = 24 * 3600;

export async function getMediaRecommendations(
  mediaType: MediaType,
  tmdbId: number,
  language = DEFAULT_LANGUAGE,
): Promise<TmdbMovieSummary[]> {
  const result = await tmdbFetch<TmdbPagedResult>(
    `/${mediaType}/${tmdbId}/recommendations`,
    { language },
    RECOMMENDATIONS_TTL_SECONDS,
  );
  const normalized = result.results
    .filter((item) => item.media_type !== "person")
    .map((item) => normalizeSummary(item, mediaType))
    .filter(hasRating);
  void upsertMovieList(normalized, language).catch((error) =>
    console.error("media recommendations cache warm failed", error),
  );
  return normalized;
}
