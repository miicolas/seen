import { asMediaType } from "@seen/shared";
import { db } from "@seen/db";
import { likes, mediaFeatures, movies as moviesTable, reviews } from "@seen/db/schema";
import { desc, eq, inArray } from "@seen/db/orm";

import type { MediaType } from "../../tmdb";
import { ENCODER_VERSION } from "../encoder";
import { mediaKey, recencyDecay, SIGNAL_WEIGHT } from "../shared";

// How many of the user's strongest positive titles to surface as anchors.
const MAX_ANCHORS = 20;
const POSITIVE_RATING_MIN = 7;

export type UserAnchor = {
  tmdbId: number;
  mediaType: MediaType;
  title: string | null;
  // Present only when the title has an up-to-date feature row; consumers that
  // need vector similarity must filter on it.
  embedding: number[] | null;
  weight: number;
};

async function gatherAnchorCandidates(
  userId: string,
  now: number,
): Promise<Map<string, { tmdbId: number; mediaType: MediaType; weight: number }>> {
  const [likeRows, ratedRows] = await Promise.all([
    db
      .select({
        tmdbId: likes.tmdbId,
        mediaType: likes.mediaType,
        kind: likes.kind,
        createdAt: likes.createdAt,
      })
      .from(likes)
      .where(eq(likes.userId, userId))
      .orderBy(desc(likes.createdAt))
      .limit(100),
    db
      .select({
        tmdbId: reviews.tmdbId,
        mediaType: reviews.mediaType,
        rating: reviews.rating,
        watchedAt: reviews.watchedAt,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(200),
  ]);

  const byKey = new Map<string, { tmdbId: number; mediaType: MediaType; weight: number }>();
  const consider = (tmdbId: number, mediaType: MediaType, base: number, timestamp: Date) => {
    const weight = base * recencyDecay(timestamp, now);
    const key = mediaKey(tmdbId, mediaType);
    const existing = byKey.get(key);
    if (!existing || weight > existing.weight) byKey.set(key, { tmdbId, mediaType, weight });
  };

  for (const row of likeRows) {
    // Weight by kind like the taste builder does; a casual like must not outrank
    // a high rating. `consider` keeps the strongest weight per title.
    const base = row.kind === "favorite" ? SIGNAL_WEIGHT.favorite : SIGNAL_WEIGHT.like;
    consider(row.tmdbId, asMediaType(row.mediaType), base, row.createdAt);
  }
  for (const row of ratedRows) {
    if (row.rating == null || row.rating < POSITIVE_RATING_MIN) continue;
    consider(
      row.tmdbId,
      asMediaType(row.mediaType),
      row.rating / 10,
      row.watchedAt ?? row.createdAt,
    );
  }

  return byKey;
}

// The user's strongest positive titles ("Because you rated X" anchors), ranked
// by recency-decayed signal weight. Titles missing a feature row still qualify
// (embedding = null) so a sparse account with a handful of ratings produces
// usable anchors for TMDB-side expansion.
export async function getUserAnchors(userId: string, now = Date.now()): Promise<UserAnchor[]> {
  const candidates = [...(await gatherAnchorCandidates(userId, now)).values()];
  if (candidates.length === 0) return [];
  const ids = candidates.map((candidate) => candidate.tmdbId);

  const [featureRows, titleRows] = await Promise.all([
    db
      .select({
        tmdbId: mediaFeatures.tmdbId,
        mediaType: mediaFeatures.mediaType,
        embedding: mediaFeatures.embedding,
        encoderVersion: mediaFeatures.encoderVersion,
      })
      .from(mediaFeatures)
      .where(inArray(mediaFeatures.tmdbId, ids)),
    db
      .select({
        tmdbId: moviesTable.tmdbId,
        mediaType: moviesTable.mediaType,
        title: moviesTable.title,
      })
      .from(moviesTable)
      .where(inArray(moviesTable.tmdbId, ids)),
  ]);

  const titles = new Map<string, string | null>();
  for (const row of titleRows) titles.set(mediaKey(row.tmdbId, row.mediaType), row.title ?? null);

  const embeddings = new Map<string, number[]>();
  for (const row of featureRows) {
    if (row.encoderVersion !== ENCODER_VERSION) continue;
    embeddings.set(mediaKey(row.tmdbId, row.mediaType), row.embedding);
  }

  return candidates
    .map((candidate) => {
      const key = mediaKey(candidate.tmdbId, candidate.mediaType);
      return {
        tmdbId: candidate.tmdbId,
        mediaType: candidate.mediaType,
        title: titles.get(key) ?? null,
        embedding: embeddings.get(key) ?? null,
        weight: candidate.weight,
      };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_ANCHORS);
}
