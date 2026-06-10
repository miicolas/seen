import { recommendationKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";

import { errorMessage } from "@/lib/format";
import { getRegion } from "@/lib/region";
import { getFeed, type FeedResponse } from "@/services/recommendations";

type Options = {
  region?: string;
  enabled?: boolean;
};

export function useFeed(options: Options = {}) {
  const region = options.region ?? getRegion();

  const query = useQuery({
    queryKey: recommendationKeys.feed(region),
    queryFn: () => getFeed({ region }),
    enabled: options.enabled ?? true,
  });

  return {
    data: (query.data ?? null) as FeedResponse | null,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error ? errorMessage(query.error, "Couldn't load your feed.") : null,
    refetch: query.refetch,
  };
}
