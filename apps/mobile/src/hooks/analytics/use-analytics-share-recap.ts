import { analyticsKeys } from "@seen/shared";

import { analyticsService, type ShareTemplate } from "@/services/analytics";

import { useAnalyticsQuery } from "./use-analytics-query";

export function useAnalyticsShareRecap(template: ShareTemplate, enabled = true) {
  return useAnalyticsQuery({
    getKey: (timezone) => analyticsKeys.shareRecap(template, timezone),
    fetcher: (timezone) => analyticsService.shareRecap(template, timezone),
    enabled,
  });
}
