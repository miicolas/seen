import { db } from "@seen/db";
import { watchlist } from "@seen/db/schema";
import { eq, sql } from "@seen/db/orm";

export type WatchlistSummary = {
  count: number;
  movie_count: number;
  tv_count: number;
  added_in_range: number;
  oldest_added_at: string | null;
};

export async function fetchWatchlistSummary(
  userId: string,
  fromISO: string,
  toISO: string,
): Promise<WatchlistSummary> {
  const from = new Date(fromISO);
  const to = new Date(toISO);

  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      movie: sql<number>`count(*) filter (where ${watchlist.mediaType} = 'movie')::int`,
      tv: sql<number>`count(*) filter (where ${watchlist.mediaType} = 'tv')::int`,
      addedInRange: sql<number>`count(*) filter (where ${watchlist.addedAt} >= ${from} and ${watchlist.addedAt} < ${to})::int`,
      oldest: sql<string | null>`min(${watchlist.addedAt})`,
    })
    .from(watchlist)
    .where(eq(watchlist.userId, userId));

  const oldest = row?.oldest ?? null;
  return {
    count: row?.count ?? 0,
    movie_count: row?.movie ?? 0,
    tv_count: row?.tv ?? 0,
    added_in_range: row?.addedInRange ?? 0,
    oldest_added_at: oldest ? new Date(oldest).toISOString() : null,
  };
}
