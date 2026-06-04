import { useAsyncResource } from "@/hooks/use-async-resource";
import { getSeriesEpisodeRatings } from "@/services/episode-reviews";

interface SeriesEpisodeRatingsState {
  ratings: number[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSeriesEpisodeRatings(
  seriesTmdbId: number,
  enabled: boolean,
): SeriesEpisodeRatingsState {
  const {
    data: ratings,
    isLoading,
    error,
    refetch,
  } = useAsyncResource<number[]>(
    () =>
      enabled && Number.isFinite(seriesTmdbId) && seriesTmdbId > 0
        ? getSeriesEpisodeRatings(seriesTmdbId)
        : Promise.resolve([]),
    [seriesTmdbId, enabled],
    [],
    "Failed to load episode ratings",
  );

  return { ratings, isLoading, error, refetch };
}
