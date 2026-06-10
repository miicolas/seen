import { db } from "@seen/db";
import { recommendationEvents } from "@seen/db/schema";
import { and, eq, gte, sql } from "@seen/db/orm";

import { mediaKey } from "../../similarity/shared";

// Netflix-style impression fatigue: a title shown repeatedly without any
// engagement gets downranked so the feed stops re-serving the same posters.
// Any engagement resets the penalty to 0.
const WINDOW_DAYS = 14;
const SHOWS_SATURATION = 8;

// mediaKey → fatigue in [0, 1].
export async function getImpressionFatigue(userId: string): Promise<Map<string, number>> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 3600 * 1000);
  const rows = await db
    .select({
      tmdbId: recommendationEvents.tmdbId,
      mediaType: recommendationEvents.mediaType,
      shows: sql<number>`count(*)`,
      engaged: sql<boolean>`bool_or(
        ${recommendationEvents.clicked}
        or ${recommendationEvents.addedToWatchlist}
        or ${recommendationEvents.markedWatched}
        or ${recommendationEvents.rated}
        or ${recommendationEvents.shared}
      )`,
    })
    .from(recommendationEvents)
    .where(and(eq(recommendationEvents.userId, userId), gte(recommendationEvents.shownAt, since)))
    .groupBy(recommendationEvents.tmdbId, recommendationEvents.mediaType);

  const fatigue = new Map<string, number>();
  for (const row of rows) {
    if (row.engaged) continue;
    fatigue.set(
      mediaKey(row.tmdbId, row.mediaType),
      Math.min(Number(row.shows) / SHOWS_SATURATION, 1),
    );
  }
  return fatigue;
}
