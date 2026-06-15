import { useQuery } from "@tanstack/react-query";
import { tmdbKeys } from "@seen/shared";
import { useTranslation } from "react-i18next";

import {
  getMediaRecommendations,
  type MediaType,
  type TmdbMovieSummary,
  tmdbLanguage,
} from "@/lib/tmdb";

interface MediaRecommendationsState {
  media: TmdbMovieSummary[];
  isLoading: boolean;
}

export function useMediaRecommendations(
  tmdbId: number,
  mediaType: MediaType,
): MediaRecommendationsState {
  const { i18n } = useTranslation();
  const language = tmdbLanguage(i18n.language);
  const query = useQuery({
    queryKey: tmdbKeys.recommendations(mediaType, tmdbId, language),
    queryFn: () => getMediaRecommendations(tmdbId, mediaType, language),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
  });

  return {
    media: query.data ?? [],
    isLoading: query.isLoading,
  };
}
