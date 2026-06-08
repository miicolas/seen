import { eden, unwrapEden } from "@/lib/eden";

import type {
  AnalyticsRange,
  DiscoveryFlow,
  Overview,
  ShareRecap,
  ShareTemplate,
  Taste,
  Timeline,
  TimelineItem,
} from "./types";

export const analyticsService = {
  overview: (range: AnalyticsRange, timezone: string): Promise<Overview> =>
    unwrapEden<Overview>(eden.analytics.overview.get({ query: { range, timezone } })),

  timeline: (range: AnalyticsRange, timezone: string): Promise<Timeline> =>
    unwrapEden<Timeline>(eden.analytics.timeline.get({ query: { range, timezone } })),

  timelineItems: (from: string, to: string, timezone: string): Promise<{ items: TimelineItem[] }> =>
    unwrapEden<{ items: TimelineItem[] }>(
      eden.analytics.timeline.items.get({ query: { from, to, timezone } }),
    ),

  taste: (range: AnalyticsRange, timezone: string): Promise<Taste> =>
    unwrapEden<Taste>(eden.analytics.taste.get({ query: { range, timezone } })),

  discoveryFlow: (range: AnalyticsRange, timezone: string): Promise<DiscoveryFlow> =>
    unwrapEden<DiscoveryFlow>(eden.analytics["discovery-flow"].get({ query: { range, timezone } })),

  shareRecap: (template: ShareTemplate, timezone: string): Promise<ShareRecap> =>
    unwrapEden<ShareRecap>(eden.analytics["share-recap"].get({ query: { template, timezone } })),
};
