import { useMemo } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { ratingToStars } from "@/services/core";
import {
  getMySeasonEpisodeRatings,
  getSeasonEpisodeStats,
  type MySeasonEpisodeRating,
  type SeasonEpisodeStat,
} from "@/services/episode-reviews";

export interface EpisodeStat {
  avg: number; // display stars 0.5..5
  ratingCount: number;
}

interface SeasonEpisodeStatsState {
  statsByEpisode: Map<number, EpisodeStat>;
  myRatingByEpisode: Map<number, number>; // display stars 0.5..5
  isLoading: boolean;
}

const EMPTY_STATS: SeasonEpisodeStat[] = [];
const EMPTY_MINE: MySeasonEpisodeRating[] = [];

export function useSeasonEpisodeStats(
  seriesTmdbId: number,
  seasonNumber: number | null,
): SeasonEpisodeStatsState {
  const enabled =
    Number.isFinite(seriesTmdbId) && seriesTmdbId > 0 && seasonNumber != null;

  const { data: stats, isLoading: isLoadingStats } =
    useAsyncResource<SeasonEpisodeStat[]>(
    () =>
      enabled
        ? getSeasonEpisodeStats(seriesTmdbId, seasonNumber as number)
        : Promise.resolve(EMPTY_STATS),
    [seriesTmdbId, seasonNumber],
    EMPTY_STATS,
    "Failed to load episode stats",
  );

  const { data: mine, isLoading: isLoadingMine } =
    useAsyncResource<MySeasonEpisodeRating[]>(
    () =>
      enabled
        ? getMySeasonEpisodeRatings(seriesTmdbId, seasonNumber as number)
        : Promise.resolve(EMPTY_MINE),
    [seriesTmdbId, seasonNumber],
    EMPTY_MINE,
    "Failed to load your ratings",
  );

  const statsByEpisode = useMemo(() => {
    const map = new Map<number, EpisodeStat>();
    for (const stat of stats) {
      map.set(stat.episode_number, {
        avg: stat.avg,
        ratingCount: stat.rating_count,
      });
    }
    return map;
  }, [stats]);

  const myRatingByEpisode = useMemo(() => {
    const map = new Map<number, number>();
    for (const row of mine) {
      map.set(row.episode_number, ratingToStars(row.rating));
    }
    return map;
  }, [mine]);

  return {
    statsByEpisode,
    myRatingByEpisode,
    isLoading: isLoadingStats || isLoadingMine,
  };
}
