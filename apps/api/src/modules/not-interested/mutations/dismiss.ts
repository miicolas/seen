import { db } from "@seen/db";
import { notInterested } from "@seen/db/schema";

import { HttpError } from "../../../lib/http-error";
import { enqueueSimilarityRefresh } from "../../similarity";
import type { NotInterestedInput } from "../shared";
import { notInterestedWhere, toNotInterestedItem } from "../shared";

// `skipTasteRefresh` lets a batch caller (onboarding swipes) enqueue a single
// taste rebuild after the whole batch instead of one per dismissal.
export async function dismiss(
  userId: string,
  input: NotInterestedInput,
  options: { skipTasteRefresh?: boolean } = {},
) {
  const [inserted] = await db
    .insert(notInterested)
    .values({
      userId,
      tmdbId: input.tmdb_id,
      mediaType: input.media_type,
      reason: input.reason ?? null,
    })
    .onConflictDoNothing({
      target: [notInterested.userId, notInterested.tmdbId, notInterested.mediaType],
    })
    .returning();

  if (inserted) {
    enqueueSimilarityRefresh(userId, {
      media: { tmdbId: input.tmdb_id, mediaType: input.media_type },
      skipTaste: options.skipTasteRefresh,
    });
    return toNotInterestedItem(inserted);
  }

  const [existing] = await db
    .select()
    .from(notInterested)
    .where(notInterestedWhere(userId, input.tmdb_id, input.media_type))
    .limit(1);

  if (!existing) {
    throw new HttpError(500, "Not-interested item could not be saved.");
  }

  return toNotInterestedItem(existing);
}
