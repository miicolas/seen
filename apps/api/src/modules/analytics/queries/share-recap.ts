import {
  accumulateWatchedTime,
  averageRatingOf,
  buildStreaks,
  buildTaste,
  buildTimeline,
  buildWatchlistBacklog,
  countKinds,
  type CurrentEra,
  type GenreCount,
  type TimelineBucket,
  totalMinutes,
} from "../helpers";
import type { Period, WatchedTime } from "../shared";
import { fetchWatchEntries } from "./fetch-watch-entries";
import { fetchWatchedDayKeys } from "./fetch-watched-days";
import { fetchWatchlistSummary } from "./fetch-watchlist-summary";
import { getAnalyticsPeriod } from "./period";

export type ShareTemplate = "weekly" | "taste" | "watchlist" | "stats";

export type ShareRecap = {
  template: ShareTemplate;
  period: Period;
  watched_time?: WatchedTime;
  total_minutes?: number;
  media_count?: number;
  episode_count?: number;
  average_rating?: number | null;
  top_genres?: GenreCount[];
  current_era?: CurrentEra;
  media_type_mix?: { movie: number; tv: number };
  total_logged?: number;
  buckets?: TimelineBucket[];
  streak?: {
    current_streak_days: number;
    longest_streak_days: number;
    active_today: boolean;
  };
  sparkline_minutes?: number[];
  backlog?: {
    count: number;
    movie_count: number;
    tv_count: number;
    per_week: number;
    weeks_to_clear: number | null;
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

export async function getShareRecap(
  userId: string,
  template: ShareTemplate,
  timezone: string | undefined,
): Promise<ShareRecap> {
  if (template === "weekly") {
    const { period, timezone: tz } = getAnalyticsPeriod("week", timezone);
    const entries = await fetchWatchEntries(userId, period.from, period.to);
    const watchedTime = accumulateWatchedTime(entries);
    const taste = buildTaste(entries);
    const timeline = buildTimeline(entries, period, tz);
    return {
      template,
      period,
      watched_time: watchedTime,
      total_minutes: totalMinutes(watchedTime),
      ...countKinds(entries),
      average_rating: averageRatingOf(entries),
      top_genres: taste.genre_mix.slice(0, 3),
      buckets: timeline.buckets,
    };
  }

  if (template === "taste") {
    const { period } = getAnalyticsPeriod("all", timezone);
    const entries = await fetchWatchEntries(userId, period.from, period.to);
    const taste = buildTaste(entries);
    return {
      template,
      period,
      top_genres: taste.genre_mix.slice(0, 3),
      current_era: taste.current_era,
      media_type_mix: taste.media_type_mix,
      total_logged: taste.total_logged,
      average_rating: taste.average_rating,
    };
  }

  if (template === "stats") {
    const { period, timezone: tz } = getAnalyticsPeriod("month", timezone);
    const now = new Date(period.to);
    const sparkFrom = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);
    const [entries, watchedDayKeys] = await Promise.all([
      fetchWatchEntries(userId, sparkFrom.toISOString(), period.to),
      fetchWatchedDayKeys(userId, tz),
    ]);

    // The fetch window starts mid-day, so the oldest enumerated bucket is
    // partial — slice it off to keep exactly WINDOW_DAYS full days.
    const sparkPeriod: Period = { ...period, from: sparkFrom.toISOString() };
    const sparkline = buildTimeline(entries, sparkPeriod, tz)
      .buckets.slice(-WINDOW_DAYS)
      .map((bucket) => bucket.total_minutes);

    const streaks = buildStreaks(watchedDayKeys, tz, now);
    const watchedTime = accumulateWatchedTime(entries);
    return {
      template,
      period,
      watched_time: watchedTime,
      total_minutes: totalMinutes(watchedTime),
      ...countKinds(entries),
      average_rating: averageRatingOf(entries),
      streak: {
        current_streak_days: streaks.current_streak_days,
        longest_streak_days: streaks.longest_streak_days,
        active_today: streaks.active_today,
      },
      sparkline_minutes: sparkline,
    };
  }

  const { period } = getAnalyticsPeriod("month", timezone);
  const velocityFrom = new Date(new Date(period.to).getTime() - WINDOW_DAYS * DAY_MS).toISOString();
  const [entries, watchlist] = await Promise.all([
    fetchWatchEntries(userId, velocityFrom, period.to),
    fetchWatchlistSummary(userId, period.from, period.to),
  ]);
  const { count, movie_count, tv_count, per_week, weeks_to_clear } = buildWatchlistBacklog(
    watchlist,
    countKinds(entries).media_count,
    WINDOW_DAYS,
  );
  return { template, period, backlog: { count, movie_count, tv_count, per_week, weeks_to_clear } };
}
