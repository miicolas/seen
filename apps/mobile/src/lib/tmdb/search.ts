import { eden, unwrapEden } from "@/lib/eden";

import { tmdbLanguage } from "./client";
import type { MediaFilter, TmdbMovieSummary } from "./types";

export async function searchMedia(
  query: string,
  filter: MediaFilter = "all",
  page = 1,
  language = tmdbLanguage(),
): Promise<TmdbMovieSummary[]> {
  return unwrapEden<TmdbMovieSummary[]>(
    eden.tmdb.search.get({
      query: { query, filter, page, language },
    }),
  );
}
