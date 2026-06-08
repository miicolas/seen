import type { ImportSummary, ImportTarget } from "../shared";
import { type MatchedItem, writeImport } from "./write-import";

export type Resolution = {
  tmdb_id: number;
  target: ImportTarget;
  rating?: number | null;
  comment?: string | null;
  watched_at?: string | null;
};

// Apply the user's picks from the review-unmatched screen. Each resolution already
// carries an exact TMDB id chosen among the candidates.
export async function resolveUnmatched(
  userId: string,
  resolutions: Resolution[],
): Promise<ImportSummary> {
  const items: MatchedItem[] = resolutions.map((resolution) => ({
    tmdbId: resolution.tmdb_id,
    target: resolution.target,
    rating: resolution.rating,
    comment: resolution.comment,
    watchedAt: resolution.watched_at ?? undefined,
  }));

  const imported = await writeImport(userId, items);
  return { imported, skipped: items.length - imported, unmatched: [] };
}
