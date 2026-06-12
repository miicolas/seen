import { db } from "@seen/db";
import { episodeReviews, reviews } from "@seen/db/schema";
import { asc, eq } from "@seen/db/orm";

export async function fetchEarliestWatchedAt(userId: string): Promise<Date | null> {
  const [reviewRows, episodeRows] = await Promise.all([
    db
      .select({ watchedAt: reviews.watchedAt })
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(asc(reviews.watchedAt))
      .limit(1),
    db
      .select({ watchedAt: episodeReviews.watchedAt })
      .from(episodeReviews)
      .where(eq(episodeReviews.userId, userId))
      .orderBy(asc(episodeReviews.watchedAt))
      .limit(1),
  ]);

  const candidates = [reviewRows[0]?.watchedAt, episodeRows[0]?.watchedAt].filter(
    (value): value is Date => value instanceof Date,
  );
  if (!candidates.length) return null;
  return new Date(Math.min(...candidates.map((value) => value.getTime())));
}
