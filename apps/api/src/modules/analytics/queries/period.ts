import { computeRange } from "../range";
import type { AnalyticsRange, Period } from "../shared";
import { resolveTimeZone } from "../tz";

export function getAnalyticsPeriod(
  range: AnalyticsRange,
  timezone: string | undefined,
  offset = 0,
): { period: Period; timezone: string } {
  const resolvedTimeZone = resolveTimeZone(timezone);
  const safeOffset = range === "all" ? 0 : Math.max(0, Math.floor(offset));
  return {
    period: computeRange(range, resolvedTimeZone, new Date(), safeOffset),
    timezone: resolvedTimeZone,
  };
}
