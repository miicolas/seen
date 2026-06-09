import { schedules } from "@trigger.dev/sdk";
import { db } from "@seen/db";
import { movies as moviesTable } from "@seen/db/schema";
import { and, asc, isNotNull, sql } from "@seen/db/orm";

import { mapWithConcurrency } from "../lib/concurrency";
import { rebuildMediaFeature } from "../modules/similarity/mutations";
import { getMediaDetail, type MediaType } from "../modules/tmdb";

// Titles cached before keywords were appended to DETAIL_APPEND keep their old
// keyword-less detail until the 30-day TTL lapses. This nightly task force-
// refreshes cached details that still lack keywords (re-pulling *with* keywords,
// in the language they were cached in) and rebuilds their feature vectors.
// Bounded per run and oldest-first so repeated runs march through the catalog;
// the keyword filter makes it self-terminating once the backlog is done.
// Concurrency is capped to respect TMDB rate limits.
const RUN_LIMIT = 200;
const CONCURRENCY = 4;

export const backfillKeywordsTask = schedules.task({
  id: "backfill-keywords",
  cron: "0 4 * * *",
  run: async () => {
    const rows = await db
      .select({
        tmdbId: moviesTable.tmdbId,
        mediaType: moviesTable.mediaType,
        language: moviesTable.language,
      })
      .from(moviesTable)
      .where(and(isNotNull(moviesTable.detail), sql`${moviesTable.detail}->'keywords' IS NULL`))
      .orderBy(asc(moviesTable.detailFetchedAt))
      .limit(RUN_LIMIT);

    let refreshed = 0;
    let built = 0;
    await mapWithConcurrency(rows, CONCURRENCY, async (row) => {
      const mediaType = row.mediaType as MediaType;
      try {
        // Force a fresh TMDB pull so movies.detail gains keywords...
        await getMediaDetail(mediaType, row.tmdbId, row.language, { forceRefresh: true });
        refreshed += 1;
        // ...then rebuild the vector from the now-fresh cached detail.
        const embedding = await rebuildMediaFeature(row.tmdbId, mediaType);
        if (embedding) built += 1;
      } catch (error) {
        console.error(`backfill-keywords: ${mediaType}:${row.tmdbId} failed`, error);
      }
    });

    return { processed: rows.length, refreshed, built };
  },
});
