import { db } from "@seen/db";
import {
  likes,
  mediaFeatures,
  notInterested,
  reviews,
  userTasteVectors,
  watchlist,
} from "@seen/db/schema";
import { desc, eq, inArray } from "@seen/db/orm";

import { mapWithConcurrency } from "../../../lib/concurrency";
import type { MediaType } from "../../tmdb";
import { blendNormalized, ENCODER_VERSION } from "../encoder";
import { mediaKey, ratingWeight, recencyDecay, SIGNAL_WEIGHT } from "../shared";
import { ensureMediaFeature } from "./build-media-feature";

// Cap signals per source so a heavy account stays bounded; recency decay means
// older signals barely move the vector anyway.
const PER_SOURCE_LIMIT = 500;
// Building a missing media feature can hit TMDB; cap the fan-out like the
// keyword backfill does to respect TMDB rate limits.
const BUILD_CONCURRENCY = 4;

type Signal = {
  tmdbId: number;
  mediaType: MediaType;
  weight: number;
  timestamp: Date;
};

async function gatherSignals(userId: string): Promise<Signal[]> {
  const [ratingRows, likeRows, watchlistRows, notInterestedRows] = await Promise.all([
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
      .limit(PER_SOURCE_LIMIT),
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
      .limit(PER_SOURCE_LIMIT),
    db
      .select({
        tmdbId: watchlist.tmdbId,
        mediaType: watchlist.mediaType,
        addedAt: watchlist.addedAt,
      })
      .from(watchlist)
      .where(eq(watchlist.userId, userId))
      .orderBy(desc(watchlist.addedAt))
      .limit(PER_SOURCE_LIMIT),
    db
      .select({
        tmdbId: notInterested.tmdbId,
        mediaType: notInterested.mediaType,
        createdAt: notInterested.createdAt,
      })
      .from(notInterested)
      .where(eq(notInterested.userId, userId))
      .orderBy(desc(notInterested.createdAt))
      .limit(PER_SOURCE_LIMIT),
  ]);

  const signals: Signal[] = [];

  for (const row of ratingRows) {
    // Only rated reviews move the vector; a text-only review carries no rating.
    if (row.rating == null) continue;
    signals.push({
      tmdbId: row.tmdbId,
      mediaType: row.mediaType as MediaType,
      weight: ratingWeight(row.rating),
      timestamp: row.watchedAt ?? row.createdAt,
    });
  }
  // A title can hold both a `like` and a `favorite` row; keep only the strongest
  // so the pair doesn't blend the same vector at 1.6× the favorite cap.
  const strongestLike = new Map<string, (typeof likeRows)[number]>();
  for (const row of likeRows) {
    const key = mediaKey(row.tmdbId, row.mediaType);
    const existing = strongestLike.get(key);
    if (!existing || (row.kind === "favorite" && existing.kind !== "favorite")) {
      strongestLike.set(key, row);
    }
  }
  for (const row of strongestLike.values()) {
    signals.push({
      tmdbId: row.tmdbId,
      mediaType: row.mediaType as MediaType,
      weight: row.kind === "favorite" ? SIGNAL_WEIGHT.favorite : SIGNAL_WEIGHT.like,
      timestamp: row.createdAt,
    });
  }
  for (const row of watchlistRows) {
    signals.push({
      tmdbId: row.tmdbId,
      mediaType: row.mediaType as MediaType,
      weight: SIGNAL_WEIGHT.watchlist,
      timestamp: row.addedAt,
    });
  }
  for (const row of notInterestedRows) {
    signals.push({
      tmdbId: row.tmdbId,
      mediaType: row.mediaType as MediaType,
      weight: SIGNAL_WEIGHT.notInterested,
      timestamp: row.createdAt,
    });
  }

  return signals;
}

// Resolve a feature vector for every distinct media a signal touches: bulk-read
// what's already encoded, then build the stragglers on demand so a cold user
// still gets a vector without waiting on the background worker.
async function resolveMediaVectors(signals: Signal[]): Promise<Map<string, number[]>> {
  const distinct = new Map<string, { tmdbId: number; mediaType: MediaType }>();
  for (const signal of signals) {
    distinct.set(mediaKey(signal.tmdbId, signal.mediaType), {
      tmdbId: signal.tmdbId,
      mediaType: signal.mediaType,
    });
  }
  if (distinct.size === 0) return new Map();

  const refs = [...distinct.values()];
  const existing = await db
    .select({
      tmdbId: mediaFeatures.tmdbId,
      mediaType: mediaFeatures.mediaType,
      embedding: mediaFeatures.embedding,
      encoderVersion: mediaFeatures.encoderVersion,
    })
    .from(mediaFeatures)
    .where(
      inArray(
        mediaFeatures.tmdbId,
        refs.map((ref) => ref.tmdbId),
      ),
    );

  const vectors = new Map<string, number[]>();
  for (const row of existing) {
    if (row.encoderVersion !== ENCODER_VERSION) continue;
    const key = mediaKey(row.tmdbId, row.mediaType);
    if (distinct.has(key)) vectors.set(key, row.embedding);
  }

  const missing = refs.filter((ref) => !vectors.has(mediaKey(ref.tmdbId, ref.mediaType)));
  await mapWithConcurrency(missing, BUILD_CONCURRENCY, async (ref) => {
    const embedding = await ensureMediaFeature(ref.tmdbId, ref.mediaType).catch((error) => {
      console.error(
        `similarity: media feature build failed for ${mediaKey(ref.tmdbId, ref.mediaType)}`,
        error,
      );
      return null;
    });
    if (embedding) vectors.set(mediaKey(ref.tmdbId, ref.mediaType), embedding);
  });

  return vectors;
}

export type BuiltTaste = {
  embedding: number[];
  signalCount: number;
};

// Pure-ish builder: gather signals, blend the media vectors they point to with
// recency-decayed weights, renormalize. Returns null when there is nothing usable
// to learn from or the blend cancels out.
export async function buildUserTaste(userId: string, now = Date.now()): Promise<BuiltTaste | null> {
  const signals = await gatherSignals(userId);
  if (signals.length === 0) return null;

  const vectors = await resolveMediaVectors(signals);

  const parts: { vector: number[]; weight: number }[] = [];
  for (const signal of signals) {
    const vector = vectors.get(mediaKey(signal.tmdbId, signal.mediaType));
    if (!vector) continue;
    parts.push({ vector, weight: signal.weight * recencyDecay(signal.timestamp, now) });
  }
  if (parts.length === 0) return null;

  const embedding = blendNormalized(parts);
  if (!embedding) return null;

  return { embedding, signalCount: parts.length };
}

// Rebuild and persist the user's taste vector. Deletes the row when no usable
// vector exists, so stale taste never lingers after a user clears their signals.
export async function rebuildUserTaste(userId: string): Promise<number[] | null> {
  const built = await buildUserTaste(userId);

  if (!built) {
    await db.delete(userTasteVectors).where(eq(userTasteVectors.userId, userId));
    return null;
  }

  const now = new Date();
  await db
    .insert(userTasteVectors)
    .values({
      userId,
      embedding: built.embedding,
      encoderVersion: ENCODER_VERSION,
      signalCount: built.signalCount,
      builtAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userTasteVectors.userId,
      set: {
        embedding: built.embedding,
        encoderVersion: ENCODER_VERSION,
        signalCount: built.signalCount,
        builtAt: now,
        updatedAt: now,
      },
    });

  return built.embedding;
}

// Return the current taste vector, rebuilding on demand when missing or stale so
// candidate generation never depends on the background worker having run.
export async function ensureUserTaste(userId: string): Promise<number[] | null> {
  const [row] = await db
    .select({
      embedding: userTasteVectors.embedding,
      encoderVersion: userTasteVectors.encoderVersion,
    })
    .from(userTasteVectors)
    .where(eq(userTasteVectors.userId, userId))
    .limit(1);

  if (row && row.encoderVersion === ENCODER_VERSION) return row.embedding;
  return rebuildUserTaste(userId);
}
