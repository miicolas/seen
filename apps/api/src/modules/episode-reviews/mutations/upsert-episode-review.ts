import { db } from "@seen/db";
import { episodeReviews } from "@seen/db/schema";

import { HttpError } from "../../../lib/http-error";
import { toApiRow } from "../../../lib/rows";
import { parseWatchedAt } from "../../../lib/watched-at";
import { resolveEpisodeRuntime } from "../queries/resolve-episode-runtime";
import type { EpisodeReviewInput } from "../shared";

export function assertEpisodeReviewInput(input: EpisodeReviewInput) {
  if (input.rating == null) {
    throw new HttpError(400, "An episode review needs a rating.");
  }
}

export async function upsertEpisodeReview(userId: string, input: EpisodeReviewInput) {
  assertEpisodeReviewInput(input);
  const rating = input.rating;
  if (rating == null) {
    throw new HttpError(400, "An episode review needs a rating.");
  }

  const watchedAt = parseWatchedAt(input.watched_at);
  const { runtimeMinutes, runtimeConfidence } = await resolveEpisodeRuntime(
    input.series_tmdb_id,
    input.season_number,
    input.episode_number,
  );

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
      runtimeMinutes,
      runtimeConfidence,
      ...(watchedAt ? { watchedAt } : {}),
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
        // Only refresh the runtime snapshot when we actually resolved one — a TMDB
        // miss on a re-rate must not erase a previously stored exact/estimated value.
        ...(runtimeConfidence !== "unknown" ? { runtimeMinutes, runtimeConfidence } : {}),
        ...(watchedAt ? { watchedAt } : {}),
      },
    })
    .returning();

  return toApiRow(review);
}
