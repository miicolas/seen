import { db } from "@seen/db";
import { reviews, watchlist } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { HttpError } from "../../../lib/http-error";
import { toApiRow } from "../../../lib/rows";
import { parseWatchedAt } from "../../../lib/watched-at";
import { getMediaDetail } from "../../tmdb";
import type { ReviewInput } from "../shared";

export function assertReviewInput(input: ReviewInput) {
  const hasRating = input.rating != null;
  const hasTitle = Boolean(input.title?.trim());
  const hasComment = Boolean(input.comment?.trim());

  if (!hasRating && !hasTitle && !hasComment) {
    throw new HttpError(400, "A review needs a rating, title, or comment.");
  }
}

export async function upsertReview(userId: string, input: ReviewInput) {
  await getMediaDetail(input.media_type, input.tmdb_id);

  // When the client omits `watched_at` we leave the column untouched: the DB
  // default (now) applies on insert, and the existing watch date is preserved on
  // update — so editing a review's text never silently re-dates the watch.
  const watchedAt = parseWatchedAt(input.watched_at);

  const review = await db.transaction(async (tx) => {
    const values = {
      userId,
      tmdbId: input.tmdb_id,
      mediaType: input.media_type,
      rating: input.rating ?? null,
      title: input.title ?? null,
      comment: input.comment ?? null,
      ...(watchedAt ? { watchedAt } : {}),
    };

    const [saved] = await tx
      .insert(reviews)
      .values(values)
      .onConflictDoUpdate({
        target: [reviews.userId, reviews.tmdbId, reviews.mediaType],
        set: {
          rating: input.rating ?? null,
          title: input.title ?? null,
          comment: input.comment ?? null,
          ...(watchedAt ? { watchedAt } : {}),
        },
      })
      .returning();

    if (!saved) {
      throw new HttpError(500, "Review could not be saved.");
    }

    await tx
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.tmdbId, input.tmdb_id),
          eq(watchlist.mediaType, input.media_type),
        ),
      );

    return saved;
  });

  return toApiRow(review);
}
