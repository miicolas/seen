import { db } from "@seen/db";
import { profiles, watchlist } from "@seen/db/schema";
import { eq } from "@seen/db/orm";

import { insertOrGet } from "../../../lib/insert-or-get";
import { enqueueSimilarityRefresh } from "../../similarity";
import { getMediaDetail } from "../../tmdb";
import type { WatchlistInput } from "../shared";
import { toWatchlistItem, watchlistMediaWhere } from "../shared";

async function defaultWatchlistVisibility(userId: string) {
  const [row] = await db
    .select({ visibility: profiles.defaultWatchlistVisibility })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return row?.visibility ?? "private";
}

export async function addToWatchlist(userId: string, input: WatchlistInput) {
  await getMediaDetail(input.media_type, input.tmdb_id);

  const visibility = await defaultWatchlistVisibility(userId);

  const { row, inserted } = await insertOrGet({
    insert: () =>
      db
        .insert(watchlist)
        .values({
          userId,
          tmdbId: input.tmdb_id,
          mediaType: input.media_type,
          visibility,
        })
        .onConflictDoNothing({
          target: [watchlist.userId, watchlist.tmdbId, watchlist.mediaType],
        })
        .returning(),
    find: () =>
      db
        .select()
        .from(watchlist)
        .where(watchlistMediaWhere(userId, input.tmdb_id, input.media_type))
        .limit(1),
    errorMessage: "Watchlist item could not be saved.",
  });

  if (inserted) {
    enqueueSimilarityRefresh(userId, {
      media: { tmdbId: input.tmdb_id, mediaType: input.media_type },
    });
  }

  return toWatchlistItem(row);
}
