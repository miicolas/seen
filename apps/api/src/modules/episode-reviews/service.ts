import { db } from "@seen/db";
import { episodeRatingStats, episodeReviews } from "@seen/db/schema";
import { and, count, desc, eq, isNotNull } from "drizzle-orm";

import { HttpError } from "../../lib/http-error";
import { toApiRow, toApiRows } from "../../lib/rows";

export type EpisodeReviewInput = {
  series_tmdb_id: number;
  episode_tmdb_id: number;
  season_number: number;
  episode_number: number;
  rating?: number | null;
  title?: string | null;
  comment?: string | null;
};

type EpisodeRef = {
  seriesTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
};

function episodeWhere(params: EpisodeRef) {
  return and(
    eq(episodeReviews.seriesTmdbId, params.seriesTmdbId),
    eq(episodeReviews.seasonNumber, params.seasonNumber),
    eq(episodeReviews.episodeNumber, params.episodeNumber),
  );
}

function episodeStatsWhere(params: EpisodeRef) {
  return and(
    eq(episodeRatingStats.seriesTmdbId, params.seriesTmdbId),
    eq(episodeRatingStats.seasonNumber, params.seasonNumber),
    eq(episodeRatingStats.episodeNumber, params.episodeNumber),
  );
}

function avgStarsFromSumCount(sum: number, total: number): number | null {
  return total > 0 ? sum / total / 2 : null;
}

export async function getMyEpisodeReview(userId: string, params: EpisodeRef) {
  const [review] = await db
    .select()
    .from(episodeReviews)
    .where(and(eq(episodeReviews.userId, userId), episodeWhere(params)))
    .limit(1);

  return review ? toApiRow(review) : null;
}

export function assertEpisodeReviewInput(input: EpisodeReviewInput) {
  if (input.rating == null) {
    throw new HttpError(400, "An episode review needs a rating.");
  }
}

export async function upsertEpisodeReview(
  userId: string,
  input: EpisodeReviewInput,
) {
  assertEpisodeReviewInput(input);
  const rating = input.rating;
  if (rating == null) {
    throw new HttpError(400, "An episode review needs a rating.");
  }

  const [review] = await db
    .insert(episodeReviews)
    .values({
      userId,
      seriesTmdbId: input.series_tmdb_id,
      episodeTmdbId: input.episode_tmdb_id,
      seasonNumber: input.season_number,
      episodeNumber: input.episode_number,
      rating,
      title: input.title ?? null,
      comment: input.comment ?? null,
    })
    .onConflictDoUpdate({
      target: [
        episodeReviews.userId,
        episodeReviews.seriesTmdbId,
        episodeReviews.seasonNumber,
        episodeReviews.episodeNumber,
      ],
      set: {
        episodeTmdbId: input.episode_tmdb_id,
        rating,
        title: input.title ?? null,
        comment: input.comment ?? null,
      },
    })
    .returning();

  return toApiRow(review);
}

export async function deleteEpisodeReview(userId: string, params: EpisodeRef) {
  await db
    .delete(episodeReviews)
    .where(and(eq(episodeReviews.userId, userId), episodeWhere(params)));
}

export async function getEpisodeReviewsPage(
  params: EpisodeRef,
  limit = 3,
  offset = 0,
) {
  const pageSize = Math.max(1, Math.min(50, limit));
  const from = Math.max(0, offset);

  const [rows, total] = await Promise.all([
    db
      .select()
      .from(episodeReviews)
      .where(episodeWhere(params))
      .orderBy(desc(episodeReviews.createdAt))
      .limit(pageSize)
      .offset(from),
    db
      .select({ count: count() })
      .from(episodeReviews)
      .where(episodeWhere(params)),
  ]);

  return {
    reviews: toApiRows(rows),
    count: total[0]?.count ?? 0,
  };
}

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

export async function getSeasonEpisodeStats(
  seriesTmdbId: number,
  seasonNumber: number,
) {
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
