import { db } from "@seen/db";
import { episodeReviews } from "@seen/db/schema";

import { HttpError } from "../../../lib/http-error";
import { toApiRow } from "../../../lib/rows";
import type { EpisodeReviewInput } from "../shared";

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
