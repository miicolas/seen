import { recommendationKeys } from "@seen/shared";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

import { errorMessage } from "@/lib/format";
import { getRegion } from "@/lib/region";
import { getFeed, type FeedResponse } from "@/services/recommendations";

type Options = {
  region?: string;
  enabled?: boolean;
};

export function useFeed(options: Options = {}) {
  const region = options.region ?? getRegion();
  // Refresh salt sent to the server: each pull-to-refresh picks a new nonce so
  // the feed is resampled server-side. Kept out of the query key so the cache
  // holds a single feed entry per region.
  const nonceRef = useRef<string | undefined>(undefined);

  const query = useQuery({
    queryKey: recommendationKeys.feed(region),
    queryFn: () => getFeed({ region, refresh: nonceRef.current }),
    enabled: options.enabled ?? true,
  });

  const refetch = query.refetch;
  const refresh = useCallback(() => {
    nonceRef.current = Date.now().toString(36);
    return refetch();
  }, [refetch]);

  return {
    data: (query.data ?? null) as FeedResponse | null,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error ? errorMessage(query.error, "Couldn't load your feed.") : null,
    refetch: query.refetch,
    refresh,
  };
}
