import { getDiscoverFeed } from "./discover";
import type { MediaFilter, TmdbMovieSummary } from "./types";

export async function trendingMedia(
  mediaType: MediaFilter = "all",
  timeWindow: "day" | "week" = "week",
): Promise<TmdbMovieSummary[]> {
  const feed = await getDiscoverFeed(mediaType);
  return timeWindow === "day" ? feed.topToday : feed.trending;
}
