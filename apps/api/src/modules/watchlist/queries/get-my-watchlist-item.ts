import { db } from "@seen/db";
import { watchlist } from "@seen/db/schema";

import type { MediaType } from "../../tmdb";
import { toWatchlistItem, watchlistMediaWhere } from "../shared";

export async function getMyWatchlistItem(userId: string, tmdbId: number, mediaType: MediaType) {
  const [item] = await db
    .select()
    .from(watchlist)
    .where(watchlistMediaWhere(userId, tmdbId, mediaType))
    .limit(1);

  return item ? toWatchlistItem(item) : null;
}
