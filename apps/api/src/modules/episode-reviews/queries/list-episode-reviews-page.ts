import { db } from "@seen/db";
import { episodeReviews } from "@seen/db/schema";
import { count, desc } from "@seen/db/orm";

import { toApiRows } from "../../../lib/rows";
import { type EpisodeRef, episodeWhere } from "../shared";

export async function getEpisodeReviewsPage(params: EpisodeRef, limit = 3, offset = 0) {
  const pageSize = Math.max(1, Math.min(50, limit));
  const from = Math.max(0, offset);

  const [rows, total] = await Promise.all([
    db
      .select()
      .from(episodeReviews)
      .where(episodeWhere(params))
      .orderBy(desc(episodeReviews.createdAt))
      .limit(pageSize)
      .offset(from),
    db.select({ count: count() }).from(episodeReviews).where(episodeWhere(params)),
  ]);

  return {
    reviews: toApiRows(rows),
    count: total[0]?.count ?? 0,
  };
}
