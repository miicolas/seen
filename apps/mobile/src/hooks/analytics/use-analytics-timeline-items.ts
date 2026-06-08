import { analyticsKeys } from "@seen/shared";

import { analyticsService } from "@/services/analytics";

import { useAnalyticsQuery } from "./use-analytics-query";

// Drill-down for one timeline bucket. Disabled until a bucket is selected.
export function useAnalyticsTimelineItems(from: string | null, to: string | null) {
  return useAnalyticsQuery({
    getKey: (timezone) => analyticsKeys.timelineItems(from ?? "", to ?? "", timezone),
    fetcher: (timezone) => analyticsService.timelineItems(from as string, to as string, timezone),
    enabled: !!from && !!to,
  });
}
