import { db } from "@seen/db";
import { notInterested } from "@seen/db/schema";

import { enqueueSimilarityRefresh } from "../../similarity";
import type { MediaType } from "../../tmdb";
import { notInterestedWhere } from "../shared";

export async function undismiss(userId: string, tmdbId: number, mediaType: MediaType) {
  await db.delete(notInterested).where(notInterestedWhere(userId, tmdbId, mediaType));
  // A retracted signal must stop shaping recommendations.
  enqueueSimilarityRefresh(userId);
}
