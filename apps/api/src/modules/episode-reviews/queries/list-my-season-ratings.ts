import { db } from "@seen/db";
import { episodeReviews } from "@seen/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";

export async function getMySeasonEpisodeRatings(
  userId: string,
  seriesTmdbId: number,
  seasonNumber: number,
) {
  return db
    .select({
      episode_number: episodeReviews.episodeNumber,
      rating: episodeReviews.rating,
    })
    .from(episodeReviews)
    .where(
      and(
        eq(episodeReviews.userId, userId),
        eq(episodeReviews.seriesTmdbId, seriesTmdbId),
        eq(episodeReviews.seasonNumber, seasonNumber),
        isNotNull(episodeReviews.rating),
      ),
    );
}
