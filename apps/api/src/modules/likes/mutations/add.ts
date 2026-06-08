import { db } from "@seen/db";
import { likes } from "@seen/db/schema";

import { HttpError } from "../../../lib/http-error";
import { getMediaDetail } from "../../tmdb";
import type { LikeInput } from "../shared";
import { likeMediaWhere, toLikeItem } from "../shared";

export async function addLike(userId: string, input: LikeInput) {
  await getMediaDetail(input.media_type, input.tmdb_id);

  const [inserted] = await db
    .insert(likes)
    .values({
      userId,
      tmdbId: input.tmdb_id,
      mediaType: input.media_type,
      kind: input.kind,
    })
    .onConflictDoNothing({
      target: [likes.userId, likes.tmdbId, likes.mediaType, likes.kind],
    })
    .returning();

  if (inserted) return toLikeItem(inserted);

  const [existing] = await db
    .select()
    .from(likes)
    .where(likeMediaWhere(userId, input.tmdb_id, input.media_type, input.kind))
    .limit(1);

  if (!existing) {
    throw new HttpError(500, "Like could not be saved.");
  }

  return toLikeItem(existing);
}
