import {
  accumulateWatchedTime,
  averageRatingOf,
  BASELINE_SAMPLE_COUNT,
  buildBaselines,
  buildTimeline,
  countKinds,
  emptyBaselines,
  type SeriesBaselines,
  type TimelineBucket,
  totalMinutes,
} from "../helpers";
import { computeRange, type Granularity } from "../range";
import type { AnalyticsRange, Period, WatchEntry } from "../shared";
import { round } from "../shared";
import { fetchEarliestWatchedAt } from "./fetch-earliest-watched";
import { fetchWatchEntries } from "./fetch-watch-entries";
import { getAnalyticsPeriod } from "./period";

export type MetricSummary = {
  current: number;
  previous: number;
  delta: number;
  delta_pct: number | null;
};

export type RatingSummary = {
  current: number | null;
  previous: number | null;
  delta: number | null;
};

export type Series = {
  period: Period;
  granularity: Granularity;
  buckets: TimelineBucket[];
  baselines: SeriesBaselines;
  summary: {
    watch_time: MetricSummary;
    titles: MetricSummary;
    episodes: MetricSummary;
    avg_rating: RatingSummary;
  };
};

function metricsOf(entries: WatchEntry[]) {
  const { media_count, episode_count } = countKinds(entries);
  return {
    minutes: totalMinutes(accumulateWatchedTime(entries)),
    titles: media_count,
    episodes: episode_count,
    rating: averageRatingOf(entries),
  };
}

function summarize(current: number, previous: number): MetricSummary {
  return {
    current,
    previous,
    delta: current - previous,
    delta_pct: previous > 0 ? round((current - previous) / previous) : null,
  };
}

export async function getSeries(
  userId: string,
  range: AnalyticsRange,
  timezone: string | undefined,
  offset = 0,
): Promise<Series> {
  const { period: basePeriod, timezone: tz } = getAnalyticsPeriod(range, timezone, offset);

  const samplePeriods: Period[] =
    range === "all"
      ? []
      : Array.from({ length: BASELINE_SAMPLE_COUNT[range] }, (_, i) =>
          computeRange(range, tz, new Date(), offset + i + 1),
        );

  const fetchFrom = samplePeriods.length
    ? samplePeriods[samplePeriods.length - 1].from
    : basePeriod.from;
  const [entries, earliestWatchedAt] = await Promise.all([
    fetchWatchEntries(userId, fetchFrom, basePeriod.to),
    range === "all" ? Promise.resolve(null) : fetchEarliestWatchedAt(userId),
  ]);

  const periodFromMs = new Date(basePeriod.from).getTime();
  const period: Period = {
    ...basePeriod,
    has_previous: earliestWatchedAt != null && earliestWatchedAt.getTime() < periodFromMs,
  };
  const currentEntries = entries.filter((entry) => entry.watchedAt.getTime() >= periodFromMs);
  const lookbackEntries = entries.filter((entry) => entry.watchedAt.getTime() < periodFromMs);

  const timeline = buildTimeline(currentEntries, period, tz);

  const baselines = samplePeriods.length
    ? buildBaselines(
        lookbackEntries,
        samplePeriods,
        timeline.buckets.map((bucket) => bucket.key),
        range,
        tz,
      )
    : emptyBaselines();

  const previousEntries = period.previous_from
    ? lookbackEntries.filter((entry) => {
        const ms = entry.watchedAt.getTime();
        return (
          ms >= new Date(period.previous_from as string).getTime() &&
          ms < new Date(period.previous_to as string).getTime()
        );
      })
    : [];

  const current = metricsOf(currentEntries);
  const previous = metricsOf(previousEntries);

  return {
    period,
    granularity: timeline.granularity,
    buckets: timeline.buckets,
    baselines,
    summary: {
      watch_time: summarize(current.minutes, previous.minutes),
      titles: summarize(current.titles, previous.titles),
      episodes: summarize(current.episodes, previous.episodes),
      avg_rating: {
        current: current.rating,
        previous: previous.rating,
        delta:
          current.rating != null && previous.rating != null
            ? round(current.rating - previous.rating, 1)
            : null,
      },
    },
  };
}
