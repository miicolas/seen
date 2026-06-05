import { db } from "@seen/db";
import { episodeRatingStats } from "@seen/db/schema";

import { type EpisodeRef, avgStarsFromSumCount, episodeStatsWhere } from "../shared";

export async function getEpisodeStats(params: EpisodeRef) {
  const [row] = await db
    .select({
      sumRating: episodeRatingStats.sumRating,
      ratingCount: episodeRatingStats.ratingCount,
      histogram: episodeRatingStats.histogram,
    })
    .from(episodeRatingStats)
    .where(episodeStatsWhere(params))
    .limit(1);

  if (!row) return null;

  return {
    rating_count: row.ratingCount,
    avg_rating: avgStarsFromSumCount(row.sumRating, row.ratingCount),
    histogram: row.histogram ?? [],
  };
}
