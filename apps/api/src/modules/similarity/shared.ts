import type { MediaType } from "../tmdb";

export type MediaRef = {
  tmdbId: number;
  mediaType: MediaType;
};

// Canonical Map key for a title; every lookup across the module must agree on it.
export function mediaKey(tmdbId: number, mediaType: string): string {
  return `${mediaType}:${tmdbId}`;
}

export type CandidateReason = {
  anchorTmdbId: number;
  anchorMediaType: MediaType;
  anchorTitle: string | null;
};

export type ContentCandidate = MediaRef & {
  // Cosine similarity in [-1, 1]; higher is more similar.
  score: number;
  distance: number;
  reason: CandidateReason | null;
};

// Signal weights for the user taste vector. Ratings are centered so a neutral
// rating contributes ~nothing, a high rating pulls toward the title, and a low
// rating pushes away. Likes/favorites/watchlist are positive; not_interested is
// a strong negative.
export const RATING_PIVOT = 5.5;
export const RATING_SCALE = 4.5;
export const SIGNAL_WEIGHT = {
  like: 0.6,
  favorite: 1.0,
  watchlist: 0.25,
  notInterested: -1.0,
} as const;

// Recency decay: a signal halves in influence every year.
const HALF_LIFE_DAYS = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function recencyDecay(timestamp: Date, now: number): number {
  const ageDays = Math.max(0, (now - timestamp.getTime()) / MS_PER_DAY);
  return 0.5 ** (ageDays / HALF_LIFE_DAYS);
}

export function ratingWeight(rating: number): number {
  return (rating - RATING_PIVOT) / RATING_SCALE;
}
