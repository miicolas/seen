import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/lib/format";
import { getTvSeasonDetail, tmdbLanguage, type TmdbTvSeasonDetail } from "@/lib/tmdb";

interface TvSeasonDetailState {
  season: TmdbTvSeasonDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function useTvSeasonDetail(
  seriesId: number,
  seasonNumber: number | null,
): TvSeasonDetailState {
  const { i18n } = useTranslation();
  const language = tmdbLanguage(i18n.language);
  const query = useQuery({
    queryKey: ["tmdb", "season", seriesId, seasonNumber, language] as const,
    queryFn: () => getTvSeasonDetail(seriesId, seasonNumber as number, language),
    enabled: Number.isFinite(seriesId) && seriesId > 0 && seasonNumber != null,
  });

  return {
    season: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Failed to load episodes") : null,
  };
}
