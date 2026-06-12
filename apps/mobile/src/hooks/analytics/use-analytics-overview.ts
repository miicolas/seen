import { analyticsKeys } from "@seen/shared";

import { analyticsService, type AnalyticsRange } from "@/services/analytics";

import { useAnalyticsOffsetQuery } from "./use-analytics-query";

export function useAnalyticsOverview(range: AnalyticsRange, offset = 0) {
  return useAnalyticsOffsetQuery(range, offset, analyticsKeys.overview, analyticsService.overview);
}
