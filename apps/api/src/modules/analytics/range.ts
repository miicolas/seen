import type { AnalyticsRange, Period } from "./shared";
import {
  addCalendarDays,
  type CalendarDay,
  dayKeyOf,
  monthKeyOf,
  tzParts,
  zonedMidnight,
} from "./tz";

function shiftMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function computeRange(
  range: AnalyticsRange,
  timeZone: string,
  now: Date = new Date(),
  offset = 0,
): Period {
  const base = { range, timezone: timeZone };

  if (range === "all") {
    return {
      ...base,
      from: new Date(0).toISOString(),
      to: now.toISOString(),
      previous_from: null,
      previous_to: null,
      is_current: true,
      has_previous: false,
    };
  }

  const p = tzParts(now, timeZone);
  let from: Date;
  let end: Date;
  let previousFrom: Date;

  if (range === "week") {
    const sinceMonday = (p.weekday + 6) % 7; // 0=Sun..6=Sat → days since Monday
    const start = addCalendarDays(
      { year: p.year, month: p.month, day: p.day },
      -sinceMonday - offset * 7,
    );
    from = zonedMidnight(start.year, start.month, start.day, timeZone);
    const next = addCalendarDays(start, 7);
    end = zonedMidnight(next.year, next.month, next.day, timeZone);
    const prev = addCalendarDays(start, -7);
    previousFrom = zonedMidnight(prev.year, prev.month, prev.day, timeZone);
  } else if (range === "month") {
    const anchor = shiftMonths(p.year, p.month, -offset);
    from = zonedMidnight(anchor.year, anchor.month, 1, timeZone);
    const next = shiftMonths(anchor.year, anchor.month, 1);
    end = zonedMidnight(next.year, next.month, 1, timeZone);
    const prev = shiftMonths(anchor.year, anchor.month, -1);
    previousFrom = zonedMidnight(prev.year, prev.month, 1, timeZone);
  } else {
    const anchorYear = p.year - offset;
    from = zonedMidnight(anchorYear, 1, 1, timeZone);
    end = zonedMidnight(anchorYear + 1, 1, 1, timeZone);
    previousFrom = zonedMidnight(anchorYear - 1, 1, 1, timeZone);
  }

  const isCurrent = offset === 0;
  return {
    ...base,
    from: from.toISOString(),
    to: isCurrent ? now.toISOString() : end.toISOString(),
    previous_from: previousFrom.toISOString(),
    previous_to: from.toISOString(),
    is_current: isCurrent,
    has_previous: false,
  };
}

export type Granularity = "day" | "month";

export function granularityFor(range: AnalyticsRange): Granularity {
  return range === "week" || range === "month" ? "day" : "month";
}

// `toISO` is exclusive: a Period's `to` is the next period's start for
// anchored past periods, so back it off 1ms to skip the boundary bucket.
export function enumerateBuckets(
  fromISO: string,
  toISO: string,
  granularity: Granularity,
  timeZone: string,
): string[] {
  const from = new Date(fromISO);
  const to = new Date(new Date(toISO).getTime() - 1);
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
