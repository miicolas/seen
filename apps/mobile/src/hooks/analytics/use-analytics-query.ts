import { keepPreviousData, useQuery, type QueryKey } from "@tanstack/react-query";

import { useAuthContext } from "@/hooks/use-auth-context";
import { getDeviceTimeZone } from "@/lib/timezone";
import type { AnalyticsRange } from "@/services/analytics";

type AnalyticsQueryConfig<T> = {
  getKey: (timezone: string) => QueryKey;
  fetcher: (timezone: string) => Promise<T>;
  enabled?: boolean;
  keepPrevious?: boolean;
};

export function useAnalyticsQuery<T>({
  getKey,
  fetcher,
  enabled = true,
  keepPrevious = false,
}: AnalyticsQueryConfig<T>) {
  const { user } = useAuthContext();
  const timezone = getDeviceTimeZone();

  return useQuery({
    queryKey: getKey(timezone),
    queryFn: () => fetcher(timezone),
    enabled: !!user && enabled,
    placeholderData: keepPrevious ? keepPreviousData : undefined,
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

// Offset-aware variant: keeps the previous payload while navigating periods so
// the charts cross-fade instead of flashing a spinner.
export function useAnalyticsOffsetQuery<T>(
  range: AnalyticsRange,
  offset: number,
  getKey: (range: AnalyticsRange, timezone: string, offset: number) => QueryKey,
  fetcher: (range: AnalyticsRange, timezone: string, offset: number) => Promise<T>,
) {
  return useAnalyticsQuery({
    getKey: (timezone) => getKey(range, timezone, offset),
    fetcher: (timezone) => fetcher(range, timezone, offset),
    keepPrevious: true,
  });
}
