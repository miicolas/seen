import { useAsyncResource } from "@/hooks/use-async-resource";
import {
  getTvSeasonDetail,
  type TmdbTvSeasonDetail,
} from "@/lib/tmdb";

interface TvSeasonDetailState {
  season: TmdbTvSeasonDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function useTvSeasonDetail(
  seriesId: number,
  seasonNumber: number | null,
): TvSeasonDetailState {
  const { data, isLoading, error } = useAsyncResource<TmdbTvSeasonDetail | null>(
    () => {
      if (!Number.isFinite(seriesId) || seriesId <= 0 || seasonNumber == null) {
        return Promise.resolve(null);
      }
      return getTvSeasonDetail(seriesId, seasonNumber);
    },
    [seriesId, seasonNumber],
    null,
    "Failed to load episodes",
  );

  return { season: data, isLoading, error };
}
