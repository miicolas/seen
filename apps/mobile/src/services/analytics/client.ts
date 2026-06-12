import { eden, unwrapEden } from "@/lib/eden";

import type {
  AnalyticsRange,
  DiscoveryFlow,
  Overview,
  Series,
  ShareRecap,
  ShareTemplate,
  Streaks,
  Taste,
  TimelineItem,
} from "./types";

export const analyticsService = {
  overview: (range: AnalyticsRange, timezone: string, offset = 0): Promise<Overview> =>
    unwrapEden<Overview>(eden.analytics.overview.get({ query: { range, timezone, offset } })),

  series: (range: AnalyticsRange, timezone: string, offset = 0): Promise<Series> =>
    unwrapEden<Series>(eden.analytics.series.get({ query: { range, timezone, offset } })),

  streaks: (timezone: string): Promise<Streaks> =>
    unwrapEden<Streaks>(eden.analytics.streaks.get({ query: { timezone } })),

  timelineItems: (from: string, to: string, timezone: string): Promise<{ items: TimelineItem[] }> =>
    unwrapEden<{ items: TimelineItem[] }>(
      eden.analytics.timeline.items.get({ query: { from, to, timezone } }),
    ),

  taste: (range: AnalyticsRange, timezone: string, offset = 0): Promise<Taste> =>
    unwrapEden<Taste>(eden.analytics.taste.get({ query: { range, timezone, offset } })),

  discoveryFlow: (range: AnalyticsRange, timezone: string): Promise<DiscoveryFlow> =>
    unwrapEden<DiscoveryFlow>(eden.analytics["discovery-flow"].get({ query: { range, timezone } })),

  shareRecap: (template: ShareTemplate, timezone: string): Promise<ShareRecap> =>
    unwrapEden<ShareRecap>(eden.analytics["share-recap"].get({ query: { template, timezone } })),
};
