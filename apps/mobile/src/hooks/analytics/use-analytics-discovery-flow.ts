import { analyticsKeys } from "@seen/shared";

import { analyticsService, type AnalyticsRange } from "@/services/analytics";

import { useAnalyticsRangeQuery } from "./use-analytics-query";

export function useAnalyticsDiscoveryFlow(range: AnalyticsRange) {
  return useAnalyticsRangeQuery(range, analyticsKeys.discoveryFlow, analyticsService.discoveryFlow);
}
