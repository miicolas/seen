import type { MediaType } from "../tmdb";
import { RATING_SCALE } from "../similarity/shared";

// Pure collaborative-filtering math shared by the neighbor and candidate
// queries. v1 is user-user: centered cosine over co-rated titles, shrunk by
// overlap size so two users sharing 3 titles never beat two sharing 20.
export const MIN_MY_RATINGS = 3;
export const MIN_CO_RATED = 3;
export const MAX_NEIGHBORS = 20;
export const NEIGHBOR_POOL = 40;
export const SIMILARITY_SHRINKAGE = 5;
export const MIN_SIMILARITY = 0.1;
export const MIN_NEIGHBOR_RATING = 7;
export const MAX_COLLABORATIVE_CANDIDATES = 50;

export type Neighbor = {
  userId: string;
  similarity: number;
  // The neighbor's mean rating, used to center their contributions.
  mean: number;
};

export type CollaborativeCandidate = {
  tmdbId: number;
  mediaType: MediaType;
  // In [0, 1]; higher means more (and more similar) neighbors loved it.
  score: number;
  supporters: number;
};

type SimilarityInput = {
  dot: number;
  normMine: number;
  normOther: number;
  coRated: number;
};

export function neighborSimilarity({ dot, normMine, normOther, coRated }: SimilarityInput): number {
  const denominator = Math.sqrt(normMine) * Math.sqrt(normOther);
  // Zero variance on either side (all identical ratings) carries no taste
  // information — treat as orthogonal rather than dividing by zero.
  if (denominator === 0) return 0;
  const cosine = dot / denominator;
  return cosine * (coRated / (coRated + SIMILARITY_SHRINKAGE));
}

type Contribution = {
  similarity: number;
  rating: number;
  neighborMean: number;
};

export function scoreCollaborative(contributions: Contribution[]): number {
  let raw = 0;
  for (const { similarity, rating, neighborMean } of contributions) {
    raw += (similarity * Math.max(0, rating - neighborMean)) / RATING_SCALE;
  }
  // Squash the unbounded sum into [0, 1) so it composes with other signals.
  return raw <= 0 ? 0 : raw / (1 + raw);
}
