import {
  accumulateWatchedTime,
  buildTaste,
  buildWatchlistBacklog,
  type CurrentEra,
  type GenreCount,
  totalMinutes,
} from "../helpers";
import type { Period, WatchedTime } from "../shared";
import { fetchWatchEntries } from "./fetch-watch-entries";
import { fetchWatchlistSummary } from "./fetch-watchlist-summary";
import { getAnalyticsPeriod } from "./period";

export type ShareTemplate = "weekly" | "taste" | "watchlist";

// Everything here is aggregate and public-safe by construction: counts, minutes,
// genres and an era label — never a raw search, a provider click, or an event row.
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
  backlog?: {
    count: number;
    movie_count: number;
    tv_count: number;
    per_week: number;
    weeks_to_clear: number | null;
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getShareRecap(
  userId: string,
  template: ShareTemplate,
  timezone: string | undefined,
): Promise<ShareRecap> {
  if (template === "weekly") {
    const { period } = getAnalyticsPeriod("week", timezone);
    const entries = await fetchWatchEntries(userId, period.from, period.to);
    const watchedTime = accumulateWatchedTime(entries);
    const taste = buildTaste(entries);
    return {
      template,
      period,
      watched_time: watchedTime,
      total_minutes: totalMinutes(watchedTime),
      media_count: entries.filter((entry) => entry.kind === "media").length,
      episode_count: entries.filter((entry) => entry.kind === "episode").length,
      top_genres: taste.genre_mix.slice(0, 3),
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

  // watchlist backlog — velocity measured over a true trailing 30-day window, not
  // the partial month-to-date (which would wildly over-extrapolate per_week early
  // in the month, e.g. "87 titles/week" from one day of data).
  const { period } = getAnalyticsPeriod("month", timezone);
  const WINDOW_DAYS = 30;
  const velocityFrom = new Date(new Date(period.to).getTime() - WINDOW_DAYS * DAY_MS).toISOString();
  const [entries, watchlist] = await Promise.all([
    fetchWatchEntries(userId, velocityFrom, period.to),
    fetchWatchlistSummary(userId, period.from, period.to),
  ]);
  const watchedInRange = entries.filter((entry) => entry.kind === "media").length;
  const backlog = buildWatchlistBacklog(watchlist, watchedInRange, WINDOW_DAYS);
  return {
    template,
    period,
    backlog: {
      count: backlog.count,
      movie_count: backlog.movie_count,
      tv_count: backlog.tv_count,
      per_week: backlog.per_week,
      weeks_to_clear: backlog.weeks_to_clear,
    },
  };
}
