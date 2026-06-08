import { computeRange } from "../range";
import type { AnalyticsRange, Period } from "../shared";
import { resolveTimeZone } from "../tz";

export function getAnalyticsPeriod(
  range: AnalyticsRange,
  timezone: string | undefined,
): { period: Period; timezone: string } {
  const resolvedTimeZone = resolveTimeZone(timezone);
  return {
    period: computeRange(range, resolvedTimeZone),
    timezone: resolvedTimeZone,
  };
}
