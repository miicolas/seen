import { useQuery, type QueryKey } from "@tanstack/react-query";

import { useAuthContext } from "@/hooks/use-auth-context";
import { getDeviceTimeZone } from "@/lib/timezone";
import type { AnalyticsRange } from "@/services/analytics";

type AnalyticsQueryConfig<T> = {
  getKey: (timezone: string) => QueryKey;
  fetcher: (timezone: string) => Promise<T>;
  enabled?: boolean;
};

export function useAnalyticsQuery<T>({ getKey, fetcher, enabled = true }: AnalyticsQueryConfig<T>) {
  const { user } = useAuthContext();
  const timezone = getDeviceTimeZone();

  return useQuery({
    queryKey: getKey(timezone),
    queryFn: () => fetcher(timezone),
    enabled: !!user && enabled,
  });
}

export function useAnalyticsRangeQuery<T>(
  range: AnalyticsRange,
  getKey: (range: AnalyticsRange, timezone: string) => QueryKey,
  fetcher: (range: AnalyticsRange, timezone: string) => Promise<T>,
) {
  return useAnalyticsQuery({
    getKey: (timezone) => getKey(range, timezone),
    fetcher: (timezone) => fetcher(range, timezone),
  });
}
