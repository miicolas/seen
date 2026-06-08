import { db } from "@seen/db";
import { notInterested } from "@seen/db/schema";

import { HttpError } from "../../../lib/http-error";
import type { NotInterestedInput } from "../shared";
import { notInterestedWhere, toNotInterestedItem } from "../shared";

export async function dismiss(userId: string, input: NotInterestedInput) {
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

  if (inserted) return toNotInterestedItem(inserted);

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
