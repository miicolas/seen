import { asMediaType } from "@seen/shared";
import { db } from "@seen/db";
import { mediaFeatures, notInterested, reviews } from "@seen/db/schema";
import { and, cosineDistance, eq, notExists, sql } from "@seen/db/orm";

import type { MediaType } from "../../tmdb";
import { ensureUserTaste } from "../mutations/build-user-taste";
import { mediaKey, type ContentCandidate } from "../shared";
import { selectAnchors } from "./select-anchors";

type Options = {
  limit?: number;
  mediaType?: MediaType;
};

const DEFAULT_LIMIT = 50;

// Content nearest-neighbors for a user: rank media_features by cosine distance to
// the user's taste vector, excluding titles they've already reviewed or dismissed
// (likes/watchlist stay eligible). Each result carries a "Because you rated X"
// anchor. Returns [] when the user has no usable taste vector (cold start) — the
// caller is expected to fall back to a non-personalized feed.
export async function getContentCandidates(
  userId: string,
  options: Options = {},
): Promise<ContentCandidate[]> {
  const taste = await ensureUserTaste(userId);
  if (!taste) return [];

  const limit = options.limit ?? DEFAULT_LIMIT;
  const distance = sql<number>`${cosineDistance(mediaFeatures.embedding, taste)}`;

  // The HNSW scan normally stops after `hnsw.ef_search` (default 40) candidates
  // and only then applies the filters below, so the media-type filter and the
  // NOT EXISTS exclusions could shrink results far below `limit` for heavy
  // users. Iterative scan (pgvector ≥ 0.8) keeps scanning, in exact distance
  // order, until the limit is filled. SET LOCAL needs a transaction.
  const rows = await db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL hnsw.iterative_scan = strict_order`);
    return tx
      .select({
        tmdbId: mediaFeatures.tmdbId,
        mediaType: mediaFeatures.mediaType,
        embedding: mediaFeatures.embedding,
        distance,
      })
      .from(mediaFeatures)
      .where(
        and(
          options.mediaType ? eq(mediaFeatures.mediaType, options.mediaType) : undefined,
          notExists(
            tx
              .select({ one: sql`1` })
              .from(reviews)
              .where(
                and(
                  eq(reviews.userId, userId),
                  eq(reviews.tmdbId, mediaFeatures.tmdbId),
                  eq(reviews.mediaType, mediaFeatures.mediaType),
                ),
              ),
          ),
          notExists(
            tx
              .select({ one: sql`1` })
              .from(notInterested)
              .where(
                and(
                  eq(notInterested.userId, userId),
                  eq(notInterested.tmdbId, mediaFeatures.tmdbId),
                  eq(notInterested.mediaType, mediaFeatures.mediaType),
                ),
              ),
          ),
        ),
      )
      .orderBy(distance)
      .limit(limit);
  });

  const reasons = await selectAnchors(
    userId,
    rows.map((row) => ({
      tmdbId: row.tmdbId,
      mediaType: asMediaType(row.mediaType),
      embedding: row.embedding,
    })),
  );

  return rows.map((row) => ({
    tmdbId: row.tmdbId,
    mediaType: asMediaType(row.mediaType),
    distance: row.distance,
    score: 1 - row.distance,
    reason: reasons.get(mediaKey(row.tmdbId, row.mediaType)) ?? null,
  }));
}
