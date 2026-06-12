import { analyticsKeys } from "@seen/shared";

import { analyticsService } from "@/services/analytics";

import { useAnalyticsQuery } from "./use-analytics-query";

export function useAnalyticsStreaks() {
  return useAnalyticsQuery({
    getKey: (timezone) => analyticsKeys.streaks(timezone),
    fetcher: (timezone) => analyticsService.streaks(timezone),
  });
}
