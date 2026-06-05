import { eden, unwrapEden } from "@/lib/eden";

import { tmdbLanguage } from "./client";
import type { TmdbTvEpisodeDetail, TmdbTvSeasonDetail } from "./types";

export function getTvSeasonDetail(
  seriesId: number,
  seasonNumber: number,
  language = tmdbLanguage(),
): Promise<TmdbTvSeasonDetail> {
  return unwrapEden<TmdbTvSeasonDetail>(
    eden.tmdb.tv({ seriesId }).season({ seasonNumber }).get({
      query: { language },
    }),
  );
}

export function getTvEpisodeDetail(
  seriesId: number,
  seasonNumber: number,
  episodeNumber: number,
  language = tmdbLanguage(),
): Promise<TmdbTvEpisodeDetail> {
  return unwrapEden<TmdbTvEpisodeDetail>(
    eden.tmdb.tv({ seriesId }).season({ seasonNumber }).episode({ episodeNumber }).get({
      query: { language },
    }),
  );
}
