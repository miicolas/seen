import type { MediaType } from "../tmdb";
import type { CandidateReason } from "../similarity/shared";
import type { RecommendationSource } from "../events/shared";

// Tunable v1 signal mix (epic #6). Each component is pre-normalized to [0, 1];
// a missing component contributes 0. Keep the sum at 1.0 so scores stay
// comparable when weights are retuned.
export const WEIGHTS = {
  content: 0.3,
  collaborative: 0.25,
  trendingBubble: 0.15,
  trendingGlobal: 0.1,
  availability: 0.1,
  novelty: 0.1,
} as const;

export type ScoreComponents = Partial<Record<keyof typeof WEIGHTS, number>>;

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
};

export function scoreCandidate(components: ScoreComponents): number {
  let total = 0;
  for (const key of Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]) {
    total += WEIGHTS[key] * (components[key] ?? 0);
  }
  return total;
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
