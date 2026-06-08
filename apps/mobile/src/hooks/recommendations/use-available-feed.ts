import { recommendationKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { errorMessage } from "@/lib/format";
import { getRegion } from "@/lib/region";
import { getAvailableFeed, type AvailableEntry } from "@/services/recommendations";
import type { MediaFilter } from "@/lib/tmdb";

type Options = {
  region?: string;
  filter?: MediaFilter;
  enabled?: boolean;
};

export function useAvailableFeed(options: Options = {}) {
  const region = options.region ?? getRegion();
  const filter = options.filter ?? "all";

  const query = useQuery({
    queryKey: recommendationKeys.available(region, filter),
    queryFn: () => getAvailableFeed({ region, filter }),
    enabled: options.enabled ?? true,
  });

  return {
    data: (query.data ?? []) as AvailableEntry[],
    isLoading: query.isLoading,
    error: query.error ? errorMessage(query.error, "Couldn't load the available feed.") : null,
    refetch: query.refetch,
  };
}
