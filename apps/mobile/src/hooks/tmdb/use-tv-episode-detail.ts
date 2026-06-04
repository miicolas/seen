import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/lib/format";
import {
  getTvEpisodeDetail,
  tmdbLanguage,
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
  const { i18n } = useTranslation();
  const language = tmdbLanguage(i18n.language);
  const query = useQuery({
    queryKey: [
      "tmdb",
      "episode",
      seriesId,
      seasonNumber,
      episodeNumber,
      language,
    ] as const,
    queryFn: () =>
      getTvEpisodeDetail(seriesId, seasonNumber, episodeNumber, language),
    enabled:
      Number.isFinite(seriesId) &&
      seriesId > 0 &&
      Number.isInteger(seasonNumber) &&
      seasonNumber >= 0 &&
      Number.isInteger(episodeNumber) &&
      episodeNumber > 0,
  });

  return {
    episode: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error
      ? errorMessage(query.error, "Failed to load the episode")
      : null,
  };
}
