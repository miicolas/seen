import { enumerateBuckets, type Granularity, granularityFor } from "../range";
import type { AnalyticsRange, Period, WatchEntry } from "../shared";
import { round } from "../shared";
import { tzDayKey, tzMonthKey } from "../tz";
import { countKinds } from "./entries";
import { accumulateWatchedTime, totalMinutes } from "./watched-time";

export type BaselineBound = { p25: number; p75: number };

export type SeriesBaselines = {
  watch_time: BaselineBound[] | null;
  titles: BaselineBound[] | null;
  episodes: BaselineBound[] | null;
  avg_rating: BaselineBound[] | null;
};

export const BASELINE_SAMPLE_COUNT: Record<Exclude<AnalyticsRange, "all">, number> = {
  week: 8,
  month: 6,
  year: 3,
};

const MIN_SAMPLE_PERIODS = 3;

export function emptyBaselines(): SeriesBaselines {
  return { watch_time: null, titles: null, episodes: null, avg_rating: null };
}

// Bucket position within its period: weekday for weeks, day-of-month for
// months, month-of-year for years — so the same weekday/day/month aligns
// across sample periods.
function positionOf(key: string, range: AnalyticsRange): number {
  const [year, month, day] = key.split("-").map(Number);
  if (range === "week") {
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return (weekday + 6) % 7;
  }
  if (range === "month") return day - 1;
  return month - 1;
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * p;
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (index - lo);
}

type SampleStats = { minutes: number; titles: number; episodes: number };

function boundsFor(
  samplesByPosition: Map<number, SampleStats[]>,
  positions: number[],
  metric: keyof SampleStats,
): BaselineBound[] {
  return positions.map((position) => {
    const values = (samplesByPosition.get(position) ?? [])
      .map((sample) => sample[metric])
      .sort((a, b) => a - b);
    return {
      p25: round(percentile(values, 0.25)),
      p75: round(percentile(values, 0.75)),
    };
  });
}

export function buildBaselines(
  entries: WatchEntry[],
  samplePeriods: Period[],
  currentBucketKeys: string[],
  range: AnalyticsRange,
  timeZone: string,
): SeriesBaselines {
  if (range === "all" || !samplePeriods.length) return emptyBaselines();

  const granularity: Granularity = granularityFor(range);
  const keyOf = (entry: WatchEntry) =>
    granularity === "day"
      ? tzDayKey(entry.watchedAt, timeZone)
      : tzMonthKey(entry.watchedAt, timeZone);

  const grouped = new Map<string, WatchEntry[]>();
  for (const entry of entries) {
    const key = keyOf(entry);
    const bucket = grouped.get(key);
    if (bucket) bucket.push(entry);
    else grouped.set(key, [entry]);
  }

  const samplesByPosition = new Map<number, SampleStats[]>();
  let samplesWithActivity = 0;

  for (const sample of samplePeriods) {
    const keys = enumerateBuckets(sample.from, sample.to, granularity, timeZone);
    let hasActivity = false;
    for (const key of keys) {
      const bucketEntries = grouped.get(key) ?? [];
      if (bucketEntries.length) hasActivity = true;
      const position = positionOf(key, range);
      const { media_count: titles, episode_count: episodes } = countKinds(bucketEntries);
      const minutes = bucketEntries.length
        ? totalMinutes(accumulateWatchedTime(bucketEntries))
        : 0;
      const samples = samplesByPosition.get(position);
      const stats = { minutes, titles, episodes };
      if (samples) samples.push(stats);
      else samplesByPosition.set(position, [stats]);
    }
    if (hasActivity) samplesWithActivity += 1;
  }

  if (samplesWithActivity < MIN_SAMPLE_PERIODS) return emptyBaselines();

  const positions = currentBucketKeys.map((key) => positionOf(key, range));
  return {
    watch_time: boundsFor(samplesByPosition, positions, "minutes"),
    titles: boundsFor(samplesByPosition, positions, "titles"),
    episodes: boundsFor(samplesByPosition, positions, "episodes"),
    // Rating bands are statistically too thin per bucket position; the chart
    // simply shows no band for the rating metric.
    avg_rating: null,
  };
}
