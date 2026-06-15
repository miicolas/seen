import { eden, unwrapEden } from "@/lib/eden";

import { tmdbLanguage } from "./client";
import type { MediaType, TmdbMovieSummary } from "./types";

export async function getMediaRecommendations(
  tmdbId: number,
  mediaType: MediaType,
  language = tmdbLanguage(),
): Promise<TmdbMovieSummary[]> {
  return unwrapEden<TmdbMovieSummary[]>(
    eden.tmdb({ mediaType })({ tmdbId }).recommendations.get({
      query: { language },
    }),
  );
}
