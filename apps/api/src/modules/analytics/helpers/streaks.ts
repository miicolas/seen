import { addCalendarDays, type CalendarDay, dayKeyOf, tzParts } from "../tz";

export type Streaks = {
  current_streak_days: number;
  longest_streak_days: number;
  longest_from: string | null;
  longest_to: string | null;
  active_today: boolean;
  last_30_days: boolean[];
};

function parseDayKey(key: string): CalendarDay {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

export function buildStreaks(
  watchedDayKeys: string[],
  timeZone: string,
  now = new Date(),
): Streaks {
  const daySet = new Set(watchedDayKeys);
  const sortedKeys = [...daySet].sort();

  let longest = 0;
  let longestFrom: string | null = null;
  let longestTo: string | null = null;
  let runStart: string | null = null;
  let runLength = 0;
  let previous: string | null = null;

  for (const key of sortedKeys) {
    const continues =
      previous != null && dayKeyOf(addCalendarDays(parseDayKey(previous), 1)) === key;
    if (continues) {
      runLength += 1;
    } else {
      runStart = key;
      runLength = 1;
    }
    if (runLength > longest) {
      longest = runLength;
      longestFrom = runStart;
      longestTo = key;
    }
    previous = key;
  }

  const todayParts = tzParts(now, timeZone);
  const today: CalendarDay = {
    year: todayParts.year,
    month: todayParts.month,
    day: todayParts.day,
  };
  const todayKey = dayKeyOf(today);
  const activeToday = daySet.has(todayKey);

  let current = 0;
  let cursor = activeToday ? today : addCalendarDays(today, -1);
  while (daySet.has(dayKeyOf(cursor))) {
    current += 1;
    cursor = addCalendarDays(cursor, -1);
  }

  const last30: boolean[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    last30.push(daySet.has(dayKeyOf(addCalendarDays(today, -i))));
  }

  return {
    current_streak_days: current,
    longest_streak_days: longest,
    longest_from: longestFrom,
    longest_to: longestTo,
    active_today: activeToday,
    last_30_days: last30,
  };
}
