import { useAsyncResource } from "@/hooks/use-async-resource";
import {
  getTvEpisodeDetail,
  type TmdbTvEpisodeDetail,
} from "@/lib/tmdb";

interface TvEpisodeDetailState {
  episode: TmdbTvEpisodeDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function useTvEpisodeDetail(
  seriesId: number,
  seasonNumber: number,
  episodeNumber: number,
): TvEpisodeDetailState {
  const { data, isLoading, error } = useAsyncResource<TmdbTvEpisodeDetail | null>(
    () => {
      if (
        !Number.isFinite(seriesId) ||
        seriesId <= 0 ||
        !Number.isInteger(seasonNumber) ||
        seasonNumber < 0 ||
        !Number.isInteger(episodeNumber) ||
        episodeNumber <= 0
      ) {
        return Promise.resolve(null);
      }
      return getTvEpisodeDetail(seriesId, seasonNumber, episodeNumber);
    },
    [seriesId, seasonNumber, episodeNumber],
    null,
    "Failed to load the episode",
  );

  return { episode: data, isLoading, error };
}
