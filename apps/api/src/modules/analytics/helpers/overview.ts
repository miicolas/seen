import type { Period, WatchEntry } from "../shared";
import { storedToStars } from "../shared";
import { computeCurrentEra, type CurrentEra } from "./taste";
import { accumulateWatchedTime, totalMinutes } from "./watched-time";
import type { WatchlistBacklog } from "./watchlist";

export type Overview = {
  period: Period;
  watched_time: ReturnType<typeof accumulateWatchedTime>;
  total_minutes: number;
  media_count: number;
  episode_count: number;
  average_rating: number | null;
  current_era: CurrentEra;
  previous: {
    total_minutes: number;
    media_count: number;
    episode_count: number;
  };
  deltas: {
    minutes: number;
    media_count: number;
    minutes_pct: number | null;
  };
  watchlist_backlog: WatchlistBacklog;
};

function counts(entries: WatchEntry[]) {
  let media = 0;
  let episode = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  for (const entry of entries) {
    if (entry.kind === "media") media += 1;
    else episode += 1;
    if (entry.kind === "media" && entry.rating != null) {
      ratingSum += entry.rating;
      ratingCount += 1;
    }
  }
  return { media, episode, ratingSum, ratingCount };
}

export function buildOverview(
  currentEntries: WatchEntry[],
  previousEntries: WatchEntry[],
  watchlistBacklog: WatchlistBacklog,
  period: Period,
): Overview {
  const watchedTime = accumulateWatchedTime(currentEntries);
  const minutes = totalMinutes(watchedTime);
  const current = counts(currentEntries);

  const previousTime = accumulateWatchedTime(previousEntries);
  const previousMinutes = totalMinutes(previousTime);
  const previous = counts(previousEntries);

  return {
    period,
    watched_time: watchedTime,
    total_minutes: minutes,
    media_count: current.media,
    episode_count: current.episode,
    average_rating: current.ratingCount
      ? storedToStars(current.ratingSum / current.ratingCount)
      : null,
    current_era: computeCurrentEra(currentEntries.filter((entry) => entry.kind === "media")),
    previous: {
      total_minutes: previousMinutes,
      media_count: previous.media,
      episode_count: previous.episode,
    },
    deltas: {
      minutes: minutes - previousMinutes,
      media_count: current.media - previous.media,
      minutes_pct:
        previousMinutes > 0
          ? Math.round(((minutes - previousMinutes) / previousMinutes) * 100) / 100
          : null,
    },
    watchlist_backlog: watchlistBacklog,
  };
}
