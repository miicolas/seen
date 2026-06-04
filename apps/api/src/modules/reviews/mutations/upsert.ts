import { db } from "@seen/db";
import { reviews } from "@seen/db/schema";

import { HttpError } from "../../../lib/http-error";
import { toApiRow } from "../../../lib/rows";
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
