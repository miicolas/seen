import { db } from "@seen/db";
import { likes } from "@seen/db/schema";

import { enqueueSimilarityRefresh } from "../../similarity";
import type { MediaType } from "../../tmdb";
import type { LikeKind } from "../shared";
import { likeMediaWhere } from "../shared";

export async function removeLike(
  userId: string,
  tmdbId: number,
  mediaType: MediaType,
  kind: LikeKind,
) {
  await db.delete(likes).where(likeMediaWhere(userId, tmdbId, mediaType, kind));
  // A retracted signal must stop shaping recommendations.
  enqueueSimilarityRefresh(userId);
}
