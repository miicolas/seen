import { db } from "@seen/db";
import { episodeRatingStats } from "@seen/db/schema";
import { and, eq } from "drizzle-orm";

import { avgStarsFromSumCount } from "../shared";

export async function getSeasonEpisodeStats(seriesTmdbId: number, seasonNumber: number) {
  const rows = await db
    .select({
      episodeNumber: episodeRatingStats.episodeNumber,
      sumRating: episodeRatingStats.sumRating,
      ratingCount: episodeRatingStats.ratingCount,
    })
    .from(episodeRatingStats)
    .where(
      and(
        eq(episodeRatingStats.seriesTmdbId, seriesTmdbId),
        eq(episodeRatingStats.seasonNumber, seasonNumber),
      ),
    );

  return rows.map((row) => ({
    episode_number: row.episodeNumber,
    rating_count: row.ratingCount,
    avg: avgStarsFromSumCount(row.sumRating, row.ratingCount) ?? 0,
  }));
}
