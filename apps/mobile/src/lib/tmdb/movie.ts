import { eden, unwrapEden } from "@/lib/eden";

import { tmdbLanguage } from "./client";
import type { MediaType, TmdbMovieDetail } from "./types";

export async function getMovieDetail(
  tmdbId: number,
  mediaType: MediaType = "movie",
  language = tmdbLanguage(),
): Promise<TmdbMovieDetail> {
  return unwrapEden<TmdbMovieDetail>(
    eden.tmdb({ mediaType })({ tmdbId }).get({
      query: { language },
    }),
  );
}
