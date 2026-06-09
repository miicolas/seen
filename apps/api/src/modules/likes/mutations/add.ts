import { db } from "@seen/db";
import { likes } from "@seen/db/schema";

import { insertOrGet } from "../../../lib/insert-or-get";
import { enqueueSimilarityRefresh } from "../../similarity";
import { getMediaDetail } from "../../tmdb";
import type { LikeInput } from "../shared";
import { likeMediaWhere, toLikeItem } from "../shared";

// `skipTasteRefresh` lets a batch caller (onboarding swipes) enqueue a single
// taste rebuild after the whole batch instead of one per like.
export async function addLike(
  userId: string,
  input: LikeInput,
  options: { skipTasteRefresh?: boolean } = {},
) {
  await getMediaDetail(input.media_type, input.tmdb_id);

  const { row, inserted } = await insertOrGet({
    insert: () =>
      db
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
        .returning(),
    find: () =>
      db
        .select()
        .from(likes)
        .where(likeMediaWhere(userId, input.tmdb_id, input.media_type, input.kind))
        .limit(1),
    errorMessage: "Like could not be saved.",
  });

  if (inserted) {
    enqueueSimilarityRefresh(userId, {
      media: { tmdbId: input.tmdb_id, mediaType: input.media_type },
      skipTaste: options.skipTasteRefresh,
    });
  }

  return toLikeItem(row);
}
