import { invokeTmdb, normalizeSummary } from "./client";
import type { MediaType, TmdbMovieSummary, TmdbPagedResult } from "./types";

export async function trendingMedia(
  mediaType: "all" | MediaType = "all",
  timeWindow: "day" | "week" = "week",
): Promise<TmdbMovieSummary[]> {
  const data = await invokeTmdb<TmdbPagedResult>({
    action: "trending",
    media_type: mediaType,
    time_window: timeWindow,
  });
  const fallback: MediaType = mediaType === "tv" ? "tv" : "movie";
  return data.results.map((item) => normalizeSummary(item, fallback));
}
