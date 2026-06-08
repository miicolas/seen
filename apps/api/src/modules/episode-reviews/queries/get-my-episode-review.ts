import { db } from "@seen/db";
import { episodeReviews } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { toApiRow } from "../../../lib/rows";
import { type EpisodeRef, episodeWhere } from "../shared";

export async function getMyEpisodeReview(userId: string, params: EpisodeRef) {
  const [review] = await db
    .select()
    .from(episodeReviews)
    .where(and(eq(episodeReviews.userId, userId), episodeWhere(params)))
    .limit(1);

  return review ? toApiRow(review) : null;
}
