import { useQuery } from "@tanstack/react-query";
import { tmdbKeys } from "@seen/shared";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/lib/format";
import { getPersonDetail, type TmdbPersonDetail, tmdbLanguage } from "@/lib/tmdb";

interface PersonDetailState {
  person: TmdbPersonDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function usePersonDetail(personId: number): PersonDetailState {
  const { i18n } = useTranslation();
  const language = tmdbLanguage(i18n.language);
  const query = useQuery({
    queryKey: tmdbKeys.person(personId, language),
    queryFn: () => getPersonDetail(personId, language),
    enabled: Number.isFinite(personId) && personId > 0,
  });

  return {
    person: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Failed to load person") : null,
  };
}
