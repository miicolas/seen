import { useAsyncResource } from "@/hooks/use-async-resource";
import { getTvEpisodeRatings } from "@/services/episode-reviews";

interface TvEpisodeRatingsState {
  ratings: number[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTvEpisodeRatings(
  seriesTmdbId: number,
  enabled: boolean,
): TvEpisodeRatingsState {
  const {
    data: ratings,
    isLoading,
    error,
    refetch,
  } = useAsyncResource<number[]>(
    () =>
      enabled && Number.isFinite(seriesTmdbId) && seriesTmdbId > 0
        ? getTvEpisodeRatings(seriesTmdbId)
        : Promise.resolve([]),
    [seriesTmdbId, enabled],
    [],
    "Failed to load episode ratings",
  );

  return { ratings, isLoading, error, refetch };
}
