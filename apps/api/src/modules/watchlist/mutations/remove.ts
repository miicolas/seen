import { db } from "@seen/db";
import { watchlist } from "@seen/db/schema";

import type { MediaType } from "../../tmdb";
import { watchlistMediaWhere } from "../shared";

export async function removeFromWatchlist(userId: string, tmdbId: number, mediaType: MediaType) {
  await db.delete(watchlist).where(watchlistMediaWhere(userId, tmdbId, mediaType));
}
