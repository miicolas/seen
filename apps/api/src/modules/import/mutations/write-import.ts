import { db } from "@seen/db";
import { reviews, watchlist } from "@seen/db/schema";
import { and, eq, inArray } from "@seen/db/orm";

import {
  DEFAULT_LANGUAGE,
  getMediaDetail,
  type TmdbMovieSummary,
  upsertMovieList,
} from "../../tmdb";
import { IMPORT_MEDIA_TYPE, type ImportTarget } from "../shared";

export type MatchedItem = {
  tmdbId: number;
  target: ImportTarget;
  rating?: number | null;
  comment?: string | null;
  // Present for CSV rows (the search summary); absent for RSS / resolve rows,
  // which already have an exact id but need the movie row fetched.
  summary?: TmdbMovieSummary;
};

function dedupe(items: MatchedItem[]): MatchedItem[] {
  const byTmdbId = new Map<number, MatchedItem>();
  for (const item of items) {
    const existing = byTmdbId.get(item.tmdbId);
    byTmdbId.set(
      item.tmdbId,
      existing
        ? {
            ...existing,
            rating: existing.rating ?? item.rating,
            comment: existing.comment ?? item.comment,
            summary: existing.summary ?? item.summary,
          }
        : item,
    );
  }
  return [...byTmdbId.values()];
}

// Persist matched films into reviews/watchlist. Idempotent: existing rows are
// never overwritten (onConflictDoNothing), so re-running is safe and a rating the
// user already set in Seen is preserved. Returns the count of newly inserted rows.
export async function writeImport(userId: string, items: MatchedItem[]): Promise<number> {
  if (!items.length) return 0;

  // Every imported film must exist in `movies`, else the watchlist/profile joins
  // drop it. CSV rows carry a search summary (cheap batch upsert); RSS/resolve rows
  // only have an id, so warm them through the cached detail fetch.
  const summaries = items
    .map((item) => item.summary)
    .filter((summary): summary is TmdbMovieSummary => Boolean(summary));
  if (summaries.length) await upsertMovieList(summaries, DEFAULT_LANGUAGE);

  const needsDetail = [
    ...new Set(items.filter((item) => !item.summary).map((item) => item.tmdbId)),
  ];
  await Promise.all(
    needsDetail.map((tmdbId) => getMediaDetail(IMPORT_MEDIA_TYPE, tmdbId).catch(() => null)),
  );

  const reviewItems = dedupe(items.filter((item) => item.target === "review"));
  const reviewedIds = new Set(reviewItems.map((item) => item.tmdbId));
  const watchlistItems = dedupe(
    items.filter((item) => item.target === "watchlist" && !reviewedIds.has(item.tmdbId)),
  );

  return db.transaction(async (tx) => {
    let imported = 0;

    if (reviewItems.length) {
      const inserted = await tx
        .insert(reviews)
        .values(
          reviewItems.map((item) => ({
            userId,
            tmdbId: item.tmdbId,
            mediaType: IMPORT_MEDIA_TYPE,
            rating: item.rating ?? null,
            comment: item.comment ?? null,
          })),
        )
        .onConflictDoNothing({ target: [reviews.userId, reviews.tmdbId, reviews.mediaType] })
        .returning({ tmdbId: reviews.tmdbId });
      imported += inserted.length;

      // A reviewed film is watched -> remove it from the watchlist (mirrors upsertReview).
      await tx
        .delete(watchlist)
        .where(
          and(
            eq(watchlist.userId, userId),
            eq(watchlist.mediaType, IMPORT_MEDIA_TYPE),
            inArray(watchlist.tmdbId, [...reviewedIds]),
          ),
        );
    }

    if (watchlistItems.length) {
      const inserted = await tx
        .insert(watchlist)
        .values(
          watchlistItems.map((item) => ({
            userId,
            tmdbId: item.tmdbId,
            mediaType: IMPORT_MEDIA_TYPE,
          })),
        )
        .onConflictDoNothing({ target: [watchlist.userId, watchlist.tmdbId, watchlist.mediaType] })
        .returning({ tmdbId: watchlist.tmdbId });
      imported += inserted.length;
    }

    return imported;
  });
}
