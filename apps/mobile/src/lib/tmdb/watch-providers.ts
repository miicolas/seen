import { eden, unwrapEden } from "@/lib/eden";

import { tmdbLanguage } from "./client";
import type { MediaType, TmdbWatchProviders } from "./types";

export async function getWatchProviders(
  tmdbId: number,
  mediaType: MediaType,
  region: string,
  language = tmdbLanguage(),
): Promise<TmdbWatchProviders> {
  return unwrapEden<TmdbWatchProviders>(
    eden.tmdb({ mediaType })({ tmdbId })["watch-providers"].get({
      query: { region, language },
    }),
  );
}
