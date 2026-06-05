import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { errorMessage } from "@/lib/format";
import {
  hasRating,
  searchMedia,
  type MediaFilter,
  type TmdbMovieSummary,
  tmdbLanguage,
} from "@/lib/tmdb";
import { useNetworkOnline } from "@/hooks/use-network-online";

interface SearchState {
  results: TmdbMovieSummary[];
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
}

const DEBOUNCE_MS = 350;

export function useSearchMedia(query: string, filter: MediaFilter = "all"): SearchState {
  const { i18n } = useTranslation();
  const language = tmdbLanguage(i18n.language);
  const isOnline = useNetworkOnline();
  const trimmed = query.trim();
  const debouncedQuery = useDebouncedValue(trimmed, trimmed ? DEBOUNCE_MS : 0);

  const queryResult = useQuery({
    queryKey: ["tmdb", "search", debouncedQuery, filter, language] as const,
    queryFn: () => searchMedia(debouncedQuery, filter, 1, language),
    enabled: isOnline && debouncedQuery.length > 0,
    select: (data) => data.filter(hasRating),
  });

  if (!isOnline) {
    return { results: [], isLoading: false, error: null, isOffline: true };
  }

  if (!trimmed) {
    return { results: [], isLoading: false, error: null, isOffline: false };
  }

  return {
    results: queryResult.data ?? [],
    isLoading: queryResult.isLoading || debouncedQuery !== trimmed,
    error: queryResult.error ? errorMessage(queryResult.error, "Search failed") : null,
    isOffline: false,
  };
}
