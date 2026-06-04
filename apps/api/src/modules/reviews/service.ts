import { db } from "@seen/db";
import {
  movieReviewStats,
  reviews,
  seriesEpisodeReviewStats,
} from "@seen/db/schema";
import { and, count, desc, eq } from "drizzle-orm";

import { HttpError } from "../../lib/http-error";
import { toApiRow, toApiRows } from "../../lib/rows";
import { getMediaDetail, type MediaType } from "../tmdb/service";

export type ReviewInput = {
  tmdb_id: number;
  media_type: MediaType;
  rating?: number | null;
  title?: string | null;
  comment?: string | null;
};

function mediaWhere(tmdbId: number, mediaType: MediaType) {
  return and(eq(reviews.tmdbId, tmdbId), eq(reviews.mediaType, mediaType));
}

export async function getMyReview(
  userId: string,
  tmdbId: number,
  mediaType: MediaType,
) {
  const [review] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), mediaWhere(tmdbId, mediaType)))
    .limit(1);

  return review ? toApiRow(review) : null;
}

export async function upsertReview(userId: string, input: ReviewInput) {
  await getMediaDetail(input.media_type, input.tmdb_id);

  const [review] = await db
    .insert(reviews)
    .values({
      userId,
      tmdbId: input.tmdb_id,
      mediaType: input.media_type,
      rating: input.rating ?? null,
      title: input.title ?? null,
      comment: input.comment ?? null,
    })
    .onConflictDoUpdate({
      target: [reviews.userId, reviews.tmdbId, reviews.mediaType],
      set: {
        rating: input.rating ?? null,
        title: input.title ?? null,
        comment: input.comment ?? null,
      },
    })
    .returning();

  return toApiRow(review);
}

export async function deleteReview(
  userId: string,
  tmdbId: number,
  mediaType: MediaType,
) {
  await db
    .delete(reviews)
    .where(and(eq(reviews.userId, userId), mediaWhere(tmdbId, mediaType)));
}

export async function getMediaReviewsPage(
  tmdbId: number,
  mediaType: MediaType,
  limit = 3,
  offset = 0,
) {
  const pageSize = Math.max(1, Math.min(50, limit));
  const from = Math.max(0, offset);

  const [rows, total] = await Promise.all([
    db
      .select()
      .from(reviews)
      .where(mediaWhere(tmdbId, mediaType))
      .orderBy(desc(reviews.createdAt))
      .limit(pageSize)
      .offset(from),
    db
      .select({ count: count() })
      .from(reviews)
      .where(mediaWhere(tmdbId, mediaType)),
  ]);

  return {
    reviews: toApiRows(rows),
    count: total[0]?.count ?? 0,
  };
}

export async function getMediaStats(tmdbId: number, mediaType: MediaType) {
  const source = mediaType === "tv" ? seriesEpisodeReviewStats : movieReviewStats;
  const [stats] = await db
    .select()
    .from(source)
    .where(and(eq(source.tmdbId, tmdbId), eq(source.mediaType, mediaType)))
    .limit(1);

  return stats ? toApiRow(stats) : null;
}

export function assertReviewInput(input: ReviewInput) {
  const hasRating = input.rating != null;
  const hasTitle = Boolean(input.title?.trim());
  const hasComment = Boolean(input.comment?.trim());

  if (!hasRating && !hasTitle && !hasComment) {
    throw new HttpError(400, "A review needs a rating, title, or comment.");
  }
}
