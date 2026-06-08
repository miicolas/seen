import type { AnalyticsRange } from "../shared";
import { buildOverview, buildWatchlistBacklog, type Overview } from "../helpers";
import { fetchWatchEntries } from "./fetch-watch-entries";
import { fetchWatchlistSummary } from "./fetch-watchlist-summary";
import { getAnalyticsPeriod } from "./period";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getOverview(
  userId: string,
  range: AnalyticsRange,
  timezone: string | undefined,
): Promise<Overview> {
  const { period } = getAnalyticsPeriod(range, timezone);

  const [current, previous, watchlist] = await Promise.all([
    fetchWatchEntries(userId, period.from, period.to),
    period.previous_from
      ? fetchWatchEntries(userId, period.previous_from, period.previous_to as string)
      : Promise.resolve([]),
    fetchWatchlistSummary(userId, period.from, period.to),
  ]);

  const watchedInRange = current.filter((entry) => entry.kind === "media").length;
  const rangeDays = (new Date(period.to).getTime() - new Date(period.from).getTime()) / DAY_MS;
  const backlog = buildWatchlistBacklog(watchlist, watchedInRange, rangeDays);

  return buildOverview(current, previous, backlog, period);
}
