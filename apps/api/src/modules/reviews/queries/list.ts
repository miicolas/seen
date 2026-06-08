import { db } from "@seen/db";
import { reviews } from "@seen/db/schema";
import { count, desc } from "@seen/db/orm";

import { toApiRows } from "../../../lib/rows";
import type { MediaType } from "../../tmdb";
import { mediaWhere } from "../shared";

export async function getMediaReviewsPage(
  tmdbId: number,
  mediaType: MediaType,
  limit = 3,
  offset = 0,
) {
  const pageSize = Math.max(1, Math.min(50, limit));
  const from = Math.max(0, offset);

  const [rows, total] = await Promise.all([
    db
      .select()
      .from(reviews)
      .where(mediaWhere(tmdbId, mediaType))
      .orderBy(desc(reviews.createdAt))
      .limit(pageSize)
      .offset(from),
    db.select({ count: count() }).from(reviews).where(mediaWhere(tmdbId, mediaType)),
  ]);

  return {
    reviews: toApiRows(rows),
    count: total[0]?.count ?? 0,
  };
}
