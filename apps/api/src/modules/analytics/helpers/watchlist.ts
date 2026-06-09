import { round } from "../shared";

export type WatchlistBacklog = {
  count: number;
  movie_count: number;
  tv_count: number;
  added_in_range: number;
  watched_in_range: number;
  per_week: number;
  weeks_to_clear: number | null;
  oldest_added_at: string | null;
};

export type Clearance = { per_week: number; weeks_to_clear: number | null };

export function computeClearance(
  backlog: number,
  watchedInRange: number,
  rangeDays: number,
): Clearance {
  const perDay = rangeDays > 0 ? watchedInRange / rangeDays : 0;
  const perWeek = perDay * 7;
  return {
    per_week: round(perWeek),
    weeks_to_clear: perWeek > 0 ? round(backlog / perWeek) : null,
  };
}

export type WatchlistCounts = {
  count: number;
  movie_count: number;
  tv_count: number;
  added_in_range: number;
  oldest_added_at: string | null;
};

export function buildWatchlistBacklog(
  summary: WatchlistCounts,
  watchedInRange: number,
  rangeDays: number,
): WatchlistBacklog {
  const clearance = computeClearance(summary.count, watchedInRange, rangeDays);
  return {
    count: summary.count,
    movie_count: summary.movie_count,
    tv_count: summary.tv_count,
    added_in_range: summary.added_in_range,
    watched_in_range: watchedInRange,
    per_week: clearance.per_week,
    weeks_to_clear: clearance.weeks_to_clear,
    oldest_added_at: summary.oldest_added_at,
  };
}
