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
    let media_count = 0;
    let episode_count = 0;
    for (const e of entries) {
      if (e.kind === "media") media_count += 1;
      else episode_count += 1;
    }
    return {
      template,
      period,
      watched_time: watchedTime,
      total_minutes: totalMinutes(watchedTime),
      media_count,
      episode_count,
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

  const { period } = getAnalyticsPeriod("month", timezone);
  const WINDOW_DAYS = 30;
  const velocityFrom = new Date(new Date(period.to).getTime() - WINDOW_DAYS * DAY_MS).toISOString();
  const [entries, watchlist] = await Promise.all([
    fetchWatchEntries(userId, velocityFrom, period.to),
    fetchWatchlistSummary(userId, period.from, period.to),
  ]);
  let watchedInRange = 0;
  for (const e of entries) {
    if (e.kind === "media") watchedInRange += 1;
  }
  const { count, movie_count, tv_count, per_week, weeks_to_clear } = buildWatchlistBacklog(
    watchlist,
    watchedInRange,
    WINDOW_DAYS,
  );
  return { template, period, backlog: { count, movie_count, tv_count, per_week, weeks_to_clear } };
}
