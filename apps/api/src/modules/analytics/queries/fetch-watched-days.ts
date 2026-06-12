import { db } from "@seen/db";
import { episodeReviews, reviews } from "@seen/db/schema";
import { eq, sql } from "@seen/db/orm";

// Distinct local-tz day keys (YYYY-MM-DD) the user logged anything on,
// deduped in SQL so the result scales with active days, not review count.
export async function fetchWatchedDayKeys(userId: string, timeZone: string): Promise<string[]> {
  const [reviewRows, episodeRows] = await Promise.all([
    db
      .selectDistinct({
        day: sql<string>`((${reviews.watchedAt} at time zone ${timeZone})::date)::text`,
      })
      .from(reviews)
      .where(eq(reviews.userId, userId)),
    db
      .selectDistinct({
        day: sql<string>`((${episodeReviews.watchedAt} at time zone ${timeZone})::date)::text`,
      })
      .from(episodeReviews)
      .where(eq(episodeReviews.userId, userId)),
  ]);

  return [...new Set([...reviewRows, ...episodeRows].map((row) => row.day))];
}
