import type { AnalyticsRange, Period } from "./shared";
import {
  addCalendarDays,
  type CalendarDay,
  dayKeyOf,
  monthKeyOf,
  tzParts,
  zonedMidnight,
} from "./tz";

// Resolve a range keyword into concrete calendar windows in the user's timezone.
// `to` is always "now"; `from` is the start of the current week (Monday) / month /
// year in the tz; the previous window is the equivalent full prior period so the
// overview can show an honest "vs last week/month/year" delta. "all" has no bounds.
export function computeRange(
  range: AnalyticsRange,
  timeZone: string,
  now: Date = new Date(),
): Period {
  const base = {
    range,
    timezone: timeZone,
    to: now.toISOString(),
  };

  if (range === "all") {
    return {
      ...base,
      from: new Date(0).toISOString(),
      previous_from: null,
      previous_to: null,
    };
  }

  const p = tzParts(now, timeZone);
  let from: Date;
  let previousFrom: Date;

  if (range === "week") {
    const sinceMonday = (p.weekday + 6) % 7; // 0=Sun..6=Sat → days since Monday
    const start = addCalendarDays({ year: p.year, month: p.month, day: p.day }, -sinceMonday);
    from = zonedMidnight(start.year, start.month, start.day, timeZone);
    const prev = addCalendarDays(start, -7);
    previousFrom = zonedMidnight(prev.year, prev.month, prev.day, timeZone);
  } else if (range === "month") {
    from = zonedMidnight(p.year, p.month, 1, timeZone);
    const prevMonth = p.month === 1 ? 12 : p.month - 1;
    const prevYear = p.month === 1 ? p.year - 1 : p.year;
    previousFrom = zonedMidnight(prevYear, prevMonth, 1, timeZone);
  } else {
    from = zonedMidnight(p.year, 1, 1, timeZone);
    previousFrom = zonedMidnight(p.year - 1, 1, 1, timeZone);
  }

  return {
    ...base,
    from: from.toISOString(),
    previous_from: previousFrom.toISOString(),
    previous_to: from.toISOString(),
  };
}

export type Granularity = "day" | "month";

// Day buckets for short ranges keep the chart readable; month buckets keep long
// ranges from exploding into hundreds of columns.
export function granularityFor(range: AnalyticsRange): Granularity {
  return range === "week" || range === "month" ? "day" : "month";
}

// Every bucket key between `from` and `to` (inclusive of the bucket containing
// `to`), so empty days/months still render as gaps instead of vanishing. Capped to
// keep an unbounded "all" range from generating a runaway list — the cap keeps the
// most recent MAX buckets (those adjacent to `to`), since walking forward from a
// 1970 "all" start would otherwise fill the cap with ancient empty buckets and drop
// every bucket the user actually has data in.
export function enumerateBuckets(
  fromISO: string,
  toISO: string,
  granularity: Granularity,
  timeZone: string,
): string[] {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  if (from.getTime() > to.getTime()) return [];

  const keys: string[] = [];
  const startParts = tzParts(from, timeZone);
  const endParts = tzParts(to, timeZone);
  const MAX = 400;

  if (granularity === "day") {
    let cursor: CalendarDay = {
      year: endParts.year,
      month: endParts.month,
      day: endParts.day,
    };
    const startKey = dayKeyOf({
      year: startParts.year,
      month: startParts.month,
      day: startParts.day,
    });
    while (keys.length < MAX) {
      const key = dayKeyOf(cursor);
      keys.push(key);
      if (key <= startKey) break;
      cursor = addCalendarDays(cursor, -1);
    }
    return keys.reverse();
  }

  let year = endParts.year;
  let month = endParts.month;
  const startKey = monthKeyOf(startParts.year, startParts.month);
  while (keys.length < MAX) {
    const key = monthKeyOf(year, month);
    keys.push(key);
    if (key <= startKey) break;
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }
  return keys.reverse();
}
