import { db } from "@seen/db";
import { feedEntries } from "@seen/db/schema";
import { eq } from "@seen/db/orm";

import { invalidateCachedFeed } from "../cache";
import type { ComputedFeed } from "../queries/compute-feed";

// Replace a user's precomputed feed with a fresh batch. The whole feed is one
// batch (single computed_at), so serving never mixes two computes; the response
// cache is invalidated so the next GET hydrates the new batch.
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
        section: entry.section,
        tmdbId: entry.tmdbId,
        mediaType: entry.mediaType,
        source: entry.source,
        score: entry.score,
        rank: entry.rank,
        anchorTitle: entry.anchorTitle,
        region,
        computedAt,
      })),
    );
  });
  await invalidateCachedFeed(userId, region);
}
