import { invokeTmdb } from "./client";
import type { TmdbTvEpisodeDetail, TmdbTvSeasonDetail } from "./types";

export function getTvSeasonDetail(
  seriesId: number,
  seasonNumber: number,
): Promise<TmdbTvSeasonDetail> {
  return invokeTmdb<TmdbTvSeasonDetail>({
    action: "tv_season",
    series_id: seriesId,
    season_number: seasonNumber,
  });
}

export function getTvEpisodeDetail(
  seriesId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<TmdbTvEpisodeDetail> {
  return invokeTmdb<TmdbTvEpisodeDetail>({
    action: "tv_episode",
    series_id: seriesId,
    season_number: seasonNumber,
    episode_number: episodeNumber,
  });
}
