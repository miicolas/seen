import { buildTimeline, type Timeline } from "../helpers";
import type { AnalyticsRange } from "../shared";
import { fetchWatchEntries } from "./fetch-watch-entries";
import { getAnalyticsPeriod } from "./period";

export async function getTimeline(
  userId: string,
  range: AnalyticsRange,
  timezone: string | undefined,
): Promise<Timeline> {
  const { period, timezone: tz } = getAnalyticsPeriod(range, timezone);
  const entries = await fetchWatchEntries(userId, period.from, period.to);
  return buildTimeline(entries, period, tz);
}
