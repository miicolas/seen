import { db } from "@seen/db";
import { likes, notInterested, reviews, watchlist } from "@seen/db/schema";
import { and, eq, inArray } from "@seen/db/orm";

// Titles the user has already acted on — we never ask "seen this?" about them.
export async function getSeenKeys(userId: string, tmdbIds: number[]): Promise<Set<string>> {
  if (tmdbIds.length === 0) return new Set();

  const [reviewed, listed, liked, dismissed] = await Promise.all([
    db
      .select({ tmdbId: reviews.tmdbId, mediaType: reviews.mediaType })
      .from(reviews)
      .where(and(eq(reviews.userId, userId), inArray(reviews.tmdbId, tmdbIds))),
    db
      .select({ tmdbId: watchlist.tmdbId, mediaType: watchlist.mediaType })
      .from(watchlist)
      .where(and(eq(watchlist.userId, userId), inArray(watchlist.tmdbId, tmdbIds))),
    db
      .select({ tmdbId: likes.tmdbId, mediaType: likes.mediaType })
      .from(likes)
      .where(and(eq(likes.userId, userId), inArray(likes.tmdbId, tmdbIds))),
    db
      .select({ tmdbId: notInterested.tmdbId, mediaType: notInterested.mediaType })
      .from(notInterested)
      .where(and(eq(notInterested.userId, userId), inArray(notInterested.tmdbId, tmdbIds))),
  ]);

  const seen = new Set<string>();
  for (const rows of [reviewed, listed, liked, dismissed]) {
    for (const row of rows) seen.add(`${row.mediaType}:${row.tmdbId}`);
  }
  return seen;
}
