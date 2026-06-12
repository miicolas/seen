import { buildTaste, type Taste } from "../helpers";
import type { AnalyticsRange, Period } from "../shared";
import { fetchWatchEntries } from "./fetch-watch-entries";
import { getAnalyticsPeriod } from "./period";

export type TasteResponse = Taste & { period: Period };

export async function getTaste(
  userId: string,
  range: AnalyticsRange,
  timezone: string | undefined,
  offset = 0,
): Promise<TasteResponse> {
  const { period } = getAnalyticsPeriod(range, timezone, offset);
  const entries = await fetchWatchEntries(userId, period.from, period.to);
  return { period, ...buildTaste(entries) };
}
