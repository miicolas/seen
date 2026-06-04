import { db } from "@seen/db";
import { episodeReviews } from "@seen/db/schema";
import { and, eq } from "drizzle-orm";

import { type EpisodeRef, episodeWhere } from "../shared";

export async function deleteEpisodeReview(userId: string, params: EpisodeRef) {
  await db
    .delete(episodeReviews)
    .where(and(eq(episodeReviews.userId, userId), episodeWhere(params)));
}
