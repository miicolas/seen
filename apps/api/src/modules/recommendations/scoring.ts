import type { MediaType } from "../tmdb";
import type { CandidateReason } from "../similarity/shared";
import type { RecommendationSource } from "../events/shared";

// Tunable v2 signal mix. Each component is pre-normalized to [0, 1]; a missing
// component contributes 0. Keep the sum at 1.0 so scores stay comparable when
// weights are retuned.
export const WEIGHTS = {
  content: 0.25,
  collaborative: 0.2,
  quality: 0.15,
  trendingBubble: 0.12,
  trendingGlobal: 0.08,
  availability: 0.1,
  novelty: 0.1,
} as const;

export type SignalKey = keyof typeof WEIGHTS;

// `fatigue` is observability-only: it multiplies the final score instead of
// joining the weighted mix.
export type ScoreComponents = Partial<Record<SignalKey, number>> & { fatigue?: number };

export type ScoredCandidate = {
  tmdbId: number;
  mediaType: MediaType;
  finalScore: number;
  components: ScoreComponents;
  // Which source gets credit for the impression (first source that produced it).
  source: RecommendationSource;
  reason: CandidateReason | null;
  primaryGenreId: number | null;
  directorKey: string | null;
  popularity: number | null;
  voteAverage: number | null;
  voteCount: number | null;
};

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

// Redistribute the weight of signals this user can't produce yet (no rated
// titles, no similar users, no followed profiles) across the active ones, so
// sparse accounts on a small user base aren't penalized across the board.
export function normalizeWeights(active: SignalKey[]): Record<SignalKey, number> {
  const activeSet = new Set(active);
  const activeTotal = active.reduce((sum, key) => sum + WEIGHTS[key], 0);
  const weights = {} as Record<SignalKey, number>;
  for (const key of Object.keys(WEIGHTS) as SignalKey[]) {
    weights[key] = activeSet.has(key) && activeTotal > 0 ? WEIGHTS[key] / activeTotal : 0;
  }
  return weights;
}

export function scoreCandidate(
  components: ScoreComponents,
  weights: Record<SignalKey, number> = WEIGHTS,
): number {
  let total = 0;
  for (const key of Object.keys(WEIGHTS) as SignalKey[]) {
    total += weights[key] * (components[key] ?? 0);
  }
  return total;
}

// Bayesian weighted rating (the IMDb "true Bayesian estimate"): pulls titles
// with few votes toward the global mean so a 9.2 with 40 votes doesn't outrank
// an 8.4 with 20k votes.
const QUALITY_VOTE_PRIOR = 300;
const QUALITY_GLOBAL_MEAN = 6.8;

export function qualityScore(voteAverage: number | null, voteCount: number | null): number {
  if (!voteAverage || !voteCount || voteCount <= 0) return 0;
  const weighted =
    (voteCount / (voteCount + QUALITY_VOTE_PRIOR)) * voteAverage +
    (QUALITY_VOTE_PRIOR / (voteCount + QUALITY_VOTE_PRIOR)) * QUALITY_GLOBAL_MEAN;
  // Map the realistic WR range (~5 → ~8.5) onto [0, 1].
  return clamp01((weighted - 5) / 3.5);
}

// Trending lists are rank-ordered; the head is worth ~1 and the tail ~0.
export function trendingRankScore(rank: number, total: number): number {
  if (total <= 1) return 1;
  return 1 - rank / (total - 1);
}

// Novelty favors titles outside the popularity mainstream — the "discovery"
// lever. TMDB popularity is unbounded; ~100 is already a big hit.
export function noveltyScore(popularity: number | null): number {
  return 1 - Math.min(popularity ?? 50, 100) / 100;
}
