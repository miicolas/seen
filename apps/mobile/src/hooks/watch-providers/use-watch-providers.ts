import { watchProviderKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { errorMessage } from "@/lib/format";
import { getRegion } from "@/lib/region";
import { getWatchProviders, type MediaType, type TmdbWatchProviders } from "@/lib/tmdb";

export function useWatchProviders(mediaType: MediaType, tmdbId: number, region = getRegion()) {
  const query = useQuery({
    queryKey: watchProviderKeys.forTitle(mediaType, tmdbId, region),
    queryFn: () => getWatchProviders(tmdbId, mediaType, region),
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
    staleTime: 60 * 60 * 1000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Couldn't load watch providers.") : null,
    refetch: query.refetch,
  } satisfies {
    data: TmdbWatchProviders | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => unknown;
  };
}
