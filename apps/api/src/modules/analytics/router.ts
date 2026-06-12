import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { AnalyticsModel } from "./model";
import {
  getDiscoveryFlow,
  getOverview,
  getSeries,
  getShareRecap,
  getStreaks,
  getTaste,
  getTimeline,
  getTimelineItems,
} from "./queries";
import type { AnalyticsRange } from "./shared";

const DEFAULT_RANGE: AnalyticsRange = "week";

export const analyticsController = new Elysia({
  name: "Analytics.Controller",
  prefix: "/analytics",
})
  .use(authGuard)
  .use(AnalyticsModel)
  .get(
    "/overview",
    ({ user, query }) =>
      getOverview(user.id, query.range ?? DEFAULT_RANGE, query.timezone, query.offset ?? 0),
    {
      auth: true,
      query: "analytics.RangeQuery",
      response: { 200: "analytics.Overview" },
    },
  )
  .get(
    "/timeline",
    ({ user, query }) =>
      getTimeline(user.id, query.range ?? DEFAULT_RANGE, query.timezone, query.offset ?? 0),
    {
      auth: true,
      query: "analytics.RangeQuery",
      response: { 200: "analytics.Timeline" },
    },
  )
  .get(
    "/series",
    ({ user, query }) =>
      getSeries(user.id, query.range ?? DEFAULT_RANGE, query.timezone, query.offset ?? 0),
    {
      auth: true,
      query: "analytics.RangeQuery",
      response: { 200: "analytics.Series" },
    },
  )
  .get("/streaks", ({ user, query }) => getStreaks(user.id, query.timezone), {
    auth: true,
    query: "analytics.StreaksQuery",
    response: { 200: "analytics.Streaks" },
  })
  .get("/timeline/items", ({ user, query }) => getTimelineItems(user.id, query.from, query.to), {
    auth: true,
    query: "analytics.TimelineItemsQuery",
    response: { 200: "analytics.TimelineItems" },
  })
  .get(
    "/taste",
    ({ user, query }) =>
      getTaste(user.id, query.range ?? DEFAULT_RANGE, query.timezone, query.offset ?? 0),
    {
      auth: true,
      query: "analytics.RangeQuery",
      response: { 200: "analytics.Taste" },
    },
  )
  .get(
    "/discovery-flow",
    ({ user, query }) => getDiscoveryFlow(user.id, query.range ?? DEFAULT_RANGE, query.timezone),
    {
      auth: true,
      query: "analytics.RangeQuery",
      response: { 200: "analytics.DiscoveryFlow" },
    },
  )
  .get(
    "/share-recap",
    ({ user, query }) => getShareRecap(user.id, query.template ?? "weekly", query.timezone),
    {
      auth: true,
      query: "analytics.ShareQuery",
      response: { 200: "analytics.ShareRecap" },
    },
  );
