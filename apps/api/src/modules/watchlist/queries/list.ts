import { db } from "@seen/db";
import { movies, watchlist } from "@seen/db/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import type { MediaType } from "../../tmdb";
import { toWatchlistItemWithMedia } from "../shared";

export async function getMyWatchlistPage(
  userId: string,
  mediaType?: MediaType,
  search?: string,
  limit = 20,
  offset = 0,
) {
  const pageSize = Math.max(1, Math.min(50, limit));
  const from = Math.max(0, offset);
  const term = search?.trim();

  const where = and(
    eq(watchlist.userId, userId),
    mediaType ? eq(watchlist.mediaType, mediaType) : undefined,
    term
      ? or(ilike(movies.title, `%${term}%`), ilike(movies.originalTitle, `%${term}%`))
      : undefined,
  );

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
    db.select({ count: count() }).from(watchlist).innerJoin(movies, mediaJoin).where(where),
  ]);

  return {
    items: rows.map(toWatchlistItemWithMedia),
    count: total[0]?.count ?? 0,
  };
}
