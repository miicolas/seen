import { asMediaType } from "@seen/shared";
import { db } from "@seen/db";
import { notInterested, reviews } from "@seen/db/schema";
import { aliasedTable, and, eq, gte, inArray, isNotNull, notExists, sql } from "@seen/db/orm";

import { mediaKey } from "../../similarity/shared";
import {
  MAX_COLLABORATIVE_CANDIDATES,
  MIN_NEIGHBOR_RATING,
  scoreCollaborative,
  type CollaborativeCandidate,
} from "../collaborative";
import { getNeighbors } from "./get-neighbors";

// "Loved by people with your taste": titles the user's nearest neighbors rated
// highly and the user hasn't reviewed or dismissed, scored by similarity-weighted
// rating lift. Returns [] on cold start (no usable neighbors).
export async function getCollaborativeCandidates(
  userId: string,
): Promise<CollaborativeCandidate[]> {
  const neighbors = await getNeighbors(userId);
  if (neighbors.length === 0) return [];

  const myReviews = aliasedTable(reviews, "my_reviews");
  const rows = await db
    .select({
      userId: reviews.userId,
      tmdbId: reviews.tmdbId,
      mediaType: reviews.mediaType,
      rating: reviews.rating,
    })
    .from(reviews)
    .where(
      and(
        inArray(
          reviews.userId,
          neighbors.map((neighbor) => neighbor.userId),
        ),
        isNotNull(reviews.rating),
        gte(reviews.rating, MIN_NEIGHBOR_RATING),
        notExists(
          db
            .select({ one: sql`1` })
            .from(myReviews)
            .where(
              and(
                eq(myReviews.userId, userId),
                eq(myReviews.tmdbId, reviews.tmdbId),
                eq(myReviews.mediaType, reviews.mediaType),
              ),
            ),
        ),
        notExists(
          db
            .select({ one: sql`1` })
            .from(notInterested)
            .where(
              and(
                eq(notInterested.userId, userId),
                eq(notInterested.tmdbId, reviews.tmdbId),
                eq(notInterested.mediaType, reviews.mediaType),
              ),
            ),
        ),
      ),
    );

  const neighborsById = new Map(neighbors.map((neighbor) => [neighbor.userId, neighbor]));
  const contributionsByTitle = new Map<
    string,
    { tmdbId: number; mediaType: string; contributions: Parameters<typeof scoreCollaborative>[0] }
  >();

  for (const row of rows) {
    const neighbor = neighborsById.get(row.userId);
    if (!neighbor || row.rating === null) continue;
    const key = mediaKey(row.tmdbId, row.mediaType);
    let entry = contributionsByTitle.get(key);
    if (!entry) {
      entry = { tmdbId: row.tmdbId, mediaType: row.mediaType, contributions: [] };
      contributionsByTitle.set(key, entry);
    }
    entry.contributions.push({
      similarity: neighbor.similarity,
      rating: row.rating,
      neighborMean: neighbor.mean,
    });
  }

  return [...contributionsByTitle.values()]
    .map((entry) => ({
      tmdbId: entry.tmdbId,
      mediaType: asMediaType(entry.mediaType),
      score: scoreCollaborative(entry.contributions),
      supporters: entry.contributions.length,
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_COLLABORATIVE_CANDIDATES);
}
