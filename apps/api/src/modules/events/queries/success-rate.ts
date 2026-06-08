import { db } from "@seen/db";
import { recommendationEvents } from "@seen/db/schema";
import { and, eq, gte, lte, sql } from "@seen/db/orm";

const SUCCESS_COLUMN = recommendationEvents.addedToWatchlist;

export async function getRecommendationSuccessRate(userId: string, from?: Date, to?: Date) {
  const conditions = [eq(recommendationEvents.userId, userId)];
  if (from) conditions.push(gte(recommendationEvents.shownAt, from));
  if (to) conditions.push(lte(recommendationEvents.shownAt, to));

  const [row] = await db
    .select({
      impressions: sql<number>`count(*)::int`,
      clicked: sql<number>`count(*) filter (where ${recommendationEvents.clicked})::int`,
      addedToWatchlist: sql<number>`count(*) filter (where ${recommendationEvents.addedToWatchlist})::int`,
      markedWatched: sql<number>`count(*) filter (where ${recommendationEvents.markedWatched})::int`,
      rated: sql<number>`count(*) filter (where ${recommendationEvents.rated})::int`,
      dismissed: sql<number>`count(*) filter (where ${recommendationEvents.dismissed})::int`,
      success: sql<number>`count(*) filter (where ${SUCCESS_COLUMN})::int`,
    })
    .from(recommendationEvents)
    .where(and(...conditions));

  const impressions = row?.impressions ?? 0;
  const success = row?.success ?? 0;

  return {
    impressions,
    clicked: row?.clicked ?? 0,
    added_to_watchlist: row?.addedToWatchlist ?? 0,
    marked_watched: row?.markedWatched ?? 0,
    rated: row?.rated ?? 0,
    dismissed: row?.dismissed ?? 0,
    success_rate: impressions === 0 ? 0 : success / impressions,
  };
}
