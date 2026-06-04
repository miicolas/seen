import { episodeReviewKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import {
  getEpisodeStats,
  type EpisodeStats,
} from "@/services/episode-reviews";

export function useEpisodeStats(
  seriesTmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
) {
  const query = useQuery({
    queryKey: episodeReviewKeys.stats(
      seriesTmdbId,
      seasonNumber,
      episodeNumber,
    ),
    queryFn: () => getEpisodeStats(seriesTmdbId, seasonNumber, episodeNumber),
    enabled:
      Number.isFinite(seriesTmdbId) &&
      seriesTmdbId > 0 &&
      Number.isInteger(seasonNumber) &&
      seasonNumber >= 0 &&
      Number.isInteger(episodeNumber) &&
      episodeNumber > 0,
  });

  return {
    stats: (query.data ?? null) as EpisodeStats | null,
    refetch: query.refetch,
  };
}
