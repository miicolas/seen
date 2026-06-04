import { useQuery } from "@tanstack/react-query";
import { discoverKeys } from "@seen/shared";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/lib/format";
import {
  getDiscoverFeed,
  type MediaFilter,
  type GenreRow,
  type TmdbMovieSummary,
  tmdbLanguage,
} from "@/lib/tmdb";
import { useNetworkOnline } from "@/hooks/use-network-online";

interface DiscoverMedia {
  trending: TmdbMovieSummary[];
  topToday: TmdbMovieSummary[];
  newReleases: TmdbMovieSummary[];
  genres: GenreRow[];
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  refetch: () => void;
}

const EMPTY_DISCOVER = {
  trending: [] as TmdbMovieSummary[],
  topToday: [] as TmdbMovieSummary[],
  newReleases: [] as TmdbMovieSummary[],
  genres: [] as GenreRow[],
};

export function useDiscoverMedia(filter: MediaFilter = "all"): DiscoverMedia {
  const { i18n } = useTranslation();
  const language = tmdbLanguage(i18n.language);
  const isOnline = useNetworkOnline();

  const query = useQuery({
    queryKey: discoverKeys.list(filter, language),
    queryFn: () => getDiscoverFeed(filter, language),
    enabled: isOnline,
  });

  if (!isOnline) {
    return {
      ...EMPTY_DISCOVER,
      isLoading: false,
      error: null,
      isOffline: true,
      refetch: query.refetch,
    };
  }

  const data = query.data ?? EMPTY_DISCOVER;

  return {
    trending: data.trending,
    topToday: data.topToday,
    newReleases: data.newReleases,
    genres: data.genres,
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Failed to load") : null,
    isOffline: false,
    refetch: query.refetch,
  };
}
