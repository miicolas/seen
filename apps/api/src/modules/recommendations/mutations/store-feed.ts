import { db } from "@seen/db";
import { feedEntries } from "@seen/db/schema";
import { eq } from "@seen/db/orm";

import { bumpFeedGeneration } from "../cache";
import type { ComputedFeed } from "../queries/compute-feed";

// Replace a user's precomputed candidate pool with a fresh batch. The whole
// pool is one batch (single computed_at), so serving never mixes two computes;
// bumping the feed generation orphans every cached (region, salt) response so
// the next GET hydrates the new batch.
export async function storeFeed(
  userId: string,
  region: string,
  computed: ComputedFeed,
): Promise<void> {
  const computedAt = new Date();
  await db.transaction(async (tx) => {
    await tx.delete(feedEntries).where(eq(feedEntries.userId, userId));
    if (computed.entries.length === 0) return;
    await tx.insert(feedEntries).values(
      computed.entries.map((entry) => ({
        userId,
        section: "pool",
        tmdbId: entry.tmdbId,
        mediaType: entry.mediaType,
        source: entry.source,
        score: entry.score,
        rank: entry.rank,
        components: entry.components,
        anchorTmdbId: entry.anchorTmdbId,
        anchorMediaType: entry.anchorMediaType,
        anchorTitle: entry.anchorTitle,
        primaryGenreId: entry.primaryGenreId,
        directorKey: entry.directorKey,
        popularity: entry.popularity,
        voteAverage: entry.voteAverage,
        voteCount: entry.voteCount,
        region,
        computedAt,
      })),
    );
  });
  await bumpFeedGeneration(userId);
}
