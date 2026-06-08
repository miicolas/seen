import { db } from "@seen/db";
import { recommendationEvents } from "@seen/db/schema";

import type { ImpressionInput } from "../shared";

export async function recordImpressions(userId: string, impressions: ImpressionInput[]) {
  if (impressions.length === 0) return { inserted: 0 };

  const rows = impressions.map((impression) => ({
    userId,
    tmdbId: impression.tmdb_id,
    mediaType: impression.media_type,
    source: impression.source,
    position: impression.position,
  }));

  await db.insert(recommendationEvents).values(rows);

  return { inserted: rows.length };
}
