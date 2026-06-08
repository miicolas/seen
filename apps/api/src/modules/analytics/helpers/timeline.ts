import { type Granularity, enumerateBuckets, granularityFor } from "../range";
import type { Period, WatchedTime, WatchEntry } from "../shared";
import { tzDayKey, tzMonthKey } from "../tz";
import { accumulateWatchedTime, emptyWatchedTime, totalMinutes } from "./watched-time";

export type TimelineBucket = {
  key: string;
  label: string;
  watched_time: WatchedTime;
  total_minutes: number;
  media_count: number;
  episode_count: number;
};

export type Timeline = {
  period: Period;
  granularity: Granularity;
  buckets: TimelineBucket[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Short axis labels, chosen by what reads well at each range's bucket count: weekday
// for a 7-day week, day-of-month for a ~30-day month, month name for a year/all view.
function labelFor(key: string, range: Period["range"], granularity: Granularity): string {
  if (granularity === "month") {
    const [, month] = key.split("-").map(Number);
    return MONTHS[month - 1] ?? key;
  }
  const [year, month, day] = key.split("-").map(Number);
  if (range === "week") {
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return WEEKDAYS[weekday] ?? key;
  }
  return String(day);
}

export function buildTimeline(entries: WatchEntry[], period: Period, timeZone: string): Timeline {
  const granularity = granularityFor(period.range);
  const keys = enumerateBuckets(period.from, period.to, granularity, timeZone);
  const keyOf = (entry: WatchEntry) =>
    granularity === "day"
      ? tzDayKey(entry.watchedAt, timeZone)
      : tzMonthKey(entry.watchedAt, timeZone);

  const grouped = new Map<string, WatchEntry[]>();
  for (const key of keys) grouped.set(key, []);
  for (const entry of entries) {
    const bucket = grouped.get(keyOf(entry));
    if (bucket) bucket.push(entry);
  }

  const buckets: TimelineBucket[] = keys.map((key) => {
    const bucketEntries = grouped.get(key) ?? [];
    const watchedTime = bucketEntries.length
      ? accumulateWatchedTime(bucketEntries)
      : emptyWatchedTime();
    return {
      key,
      label: labelFor(key, period.range, granularity),
      watched_time: watchedTime,
      total_minutes: totalMinutes(watchedTime),
      media_count: bucketEntries.filter((entry) => entry.kind === "media").length,
      episode_count: bucketEntries.filter((entry) => entry.kind === "episode").length,
    };
  });

  return { period, granularity, buckets };
}
