import { asMediaType } from "@seen/shared";
import { db } from "@seen/db";
import { likes, mediaFeatures, movies as moviesTable, reviews } from "@seen/db/schema";
import { desc, eq, inArray } from "@seen/db/orm";

import type { MediaType } from "../../tmdb";
import { ENCODER_VERSION } from "../encoder";
import { mediaKey, recencyDecay, SIGNAL_WEIGHT, type CandidateReason } from "../shared";

// How many of the user's strongest positive titles to consider as "Because you
// rated X" anchors. Small: each candidate only needs its single closest anchor.
const MAX_ANCHORS = 20;
const POSITIVE_RATING_MIN = 7;
// Below this cosine similarity an anchor explains nothing — better to return
// null than to name an unrelated title.
const MIN_ANCHOR_SIMILARITY = 0.2;

type Anchor = {
  tmdbId: number;
  mediaType: MediaType;
  title: string | null;
  embedding: number[];
  weight: number;
};

// Unit vectors → cosine similarity is the dot product.
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

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

async function loadAnchors(
  candidates: { tmdbId: number; mediaType: MediaType; weight: number }[],
): Promise<Anchor[]> {
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

  const byKey = new Map(candidates.map((c) => [mediaKey(c.tmdbId, c.mediaType), c]));
  const anchors: Anchor[] = [];
  for (const row of featureRows) {
    if (row.encoderVersion !== ENCODER_VERSION) continue;
    const key = mediaKey(row.tmdbId, row.mediaType);
    const candidate = byKey.get(key);
    if (!candidate) continue;
    anchors.push({
      tmdbId: row.tmdbId,
      mediaType: asMediaType(row.mediaType),
      title: titles.get(key) ?? null,
      embedding: row.embedding,
      weight: candidate.weight,
    });
  }

  return anchors.sort((a, b) => b.weight - a.weight).slice(0, MAX_ANCHORS);
}

// For each candidate, pick the user's positive title whose vector is most similar
// — the "Because you rated X" explanation. Candidates with no usable anchor get null.
export async function selectAnchors(
  userId: string,
  candidates: { tmdbId: number; mediaType: MediaType; embedding: number[] }[],
  now = Date.now(),
): Promise<Map<string, CandidateReason>> {
  const anchorCandidates = await gatherAnchorCandidates(userId, now);
  const anchors = await loadAnchors([...anchorCandidates.values()]);
  const reasons = new Map<string, CandidateReason>();
  if (anchors.length === 0) return reasons;

  for (const candidate of candidates) {
    let best: Anchor | null = null;
    let bestScore = -Infinity;
    for (const anchor of anchors) {
      // Don't explain a title with itself.
      if (anchor.tmdbId === candidate.tmdbId && anchor.mediaType === candidate.mediaType) continue;
      const score = dot(candidate.embedding, anchor.embedding);
      if (score > bestScore) {
        bestScore = score;
        best = anchor;
      }
    }
    if (best && bestScore >= MIN_ANCHOR_SIMILARITY) {
      reasons.set(mediaKey(candidate.tmdbId, candidate.mediaType), {
        anchorTmdbId: best.tmdbId,
        anchorMediaType: best.mediaType,
        anchorTitle: best.title,
      });
    }
  }

  return reasons;
}
