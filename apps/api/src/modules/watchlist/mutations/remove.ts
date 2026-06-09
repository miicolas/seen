import { db } from "@seen/db";
import { watchlist } from "@seen/db/schema";

import { enqueueSimilarityRefresh } from "../../similarity";
import type { MediaType } from "../../tmdb";
import { watchlistMediaWhere } from "../shared";

export async function removeFromWatchlist(userId: string, tmdbId: number, mediaType: MediaType) {
  await db.delete(watchlist).where(watchlistMediaWhere(userId, tmdbId, mediaType));
  // A retracted signal must stop shaping recommendations.
  enqueueSimilarityRefresh(userId);
}
