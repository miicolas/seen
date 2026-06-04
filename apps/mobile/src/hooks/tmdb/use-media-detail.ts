import { useQuery } from "@tanstack/react-query";
import { tmdbKeys } from "@seen/shared";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/lib/format";
import {
  getMovieDetail,
  type MediaType,
  type TmdbMovieDetail,
  tmdbLanguage,
} from "@/lib/tmdb";

interface MediaDetailState {
  detail: TmdbMovieDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function useMediaDetail(
  tmdbId: number,
  mediaType: MediaType,
): MediaDetailState {
  const { i18n } = useTranslation();
  const language = tmdbLanguage(i18n.language);
  const query = useQuery({
    queryKey: tmdbKeys.detail(mediaType, tmdbId, language),
    queryFn: () => getMovieDetail(tmdbId, mediaType, language),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
  });

  return {
    detail: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error
      ? errorMessage(query.error, "Failed to load details")
      : null,
  };
}
