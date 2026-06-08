import { db } from "@seen/db";
import { movieReviewStats, seriesEpisodeReviewStats } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { toApiRow } from "../../../lib/rows";
import type { MediaType } from "../../tmdb";

export async function getMediaStats(tmdbId: number, mediaType: MediaType) {
  const source = mediaType === "tv" ? seriesEpisodeReviewStats : movieReviewStats;
  const [stats] = await db
    .select()
    .from(source)
    .where(and(eq(source.tmdbId, tmdbId), eq(source.mediaType, mediaType)))
    .limit(1);

  return stats ? toApiRow(stats) : null;
}
