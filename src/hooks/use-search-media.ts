import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/lib/format";
import { searchMedia, type MediaFilter, type TmdbMovieSummary } from "@/lib/tmdb";

interface SearchState {
  results: TmdbMovieSummary[];
  isLoading: boolean;
  error: string | null;
}

const DEBOUNCE_MS = 350;

export function useSearchMedia(
  query: string,
  filter: MediaFilter = "all",
): SearchState {
  const { i18n } = useTranslation();
  const language = i18n.language;
  const [results, setResults] = useState<TmdbMovieSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = query.trim();

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (!trimmed) {
        setResults([]);
        setError(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await searchMedia(trimmed, filter);
        if (!cancelled) setResults(data);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Search failed"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, trimmed ? DEBOUNCE_MS : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, filter, language]);

  return { results, isLoading, error };
}
