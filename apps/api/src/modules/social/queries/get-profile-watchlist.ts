import { db } from "@seen/db";
import { movies, watchlist } from "@seen/db/schema";
import { and, count, desc, eq, inArray } from "@seen/db/orm";

import { toMediaSummary } from "../../watchlist/shared";
import { canViewWatchlistVisibility, loadViewableProfile, normalizePagination } from "../shared";

// Which visibility values the viewer is allowed to see, pushed into the query so
// hidden rows never leave the database and the count matches what's returned.
function allowedVisibilities(viewerId: string, ownerId: string, isFollowing: boolean): string[] {
  if (viewerId === ownerId) return ["private", "followers", "public"];
  return isFollowing ? ["followers", "public"] : ["public"];
}

export async function getSocialProfileWatchlist(
  viewerId: string,
  profileId: string,
  limit = 20,
  offset = 0,
) {
  const { state } = await loadViewableProfile(viewerId, profileId);

  const { pageSize, offset: from } = normalizePagination(limit, offset);
  const visibilities = allowedVisibilities(viewerId, profileId, state.isFollowing);

  const where = and(eq(watchlist.userId, profileId), inArray(watchlist.visibility, visibilities));
  const mediaJoin = and(
    eq(watchlist.tmdbId, movies.tmdbId),
    eq(watchlist.mediaType, movies.mediaType),
  );

  const [rows, total] = await Promise.all([
    db
      .select({ watchlist, media: movies })
      .from(watchlist)
      .innerJoin(movies, mediaJoin)
      .where(where)
      .orderBy(desc(watchlist.addedAt))
      .limit(pageSize)
      .offset(from),
    db.select({ value: count() }).from(watchlist).innerJoin(movies, mediaJoin).where(where),
  ]);

  const items = rows
    .filter((entry) =>
      canViewWatchlistVisibility(
        entry.watchlist.visibility,
        viewerId,
        profileId,
        state.isFollowing,
      ),
    )
    .map((entry) => ({
      id: entry.watchlist.id,
      tmdb_id: entry.watchlist.tmdbId,
      media_type: entry.watchlist.mediaType as "movie" | "tv",
      added_at: entry.watchlist.addedAt.toISOString(),
      visibility: entry.watchlist.visibility as "private" | "followers" | "public",
      media: toMediaSummary(entry.media),
    }));

  return { items, count: total[0]?.value ?? 0 };
}
