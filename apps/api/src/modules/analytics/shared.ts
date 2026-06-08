import type { RecommendationSource } from "../events/shared";

export type AnalyticsRange = "week" | "month" | "year" | "all";

export const ANALYTICS_RANGES: AnalyticsRange[] = ["week", "month", "year", "all"];

export type RuntimeConfidence = "exact" | "estimated" | "unknown";

// Splitting watched time three ways is the spine of the whole feature: minutes we
// trust (`exact`), minutes we inferred from a series average (`estimated`), and
// items we counted but couldn't time (`unknown_count`) — never silently dropped.
export type WatchedTime = {
  exact_minutes: number;
  estimated_minutes: number;
  unknown_count: number;
};

export type Period = {
  range: AnalyticsRange;
  timezone: string;
  from: string;
  to: string;
  previous_from: string | null;
  previous_to: string | null;
};

// A single watched thing, normalized across movie/tv reviews and episode reviews.
// `countsTowardTime` is false for series-level tv reviews: they're a log, not time
// watched (you didn't watch "the whole series" in one sitting).
export type WatchEntry = {
  watchedAt: Date;
  mediaType: "movie" | "tv";
  kind: "media" | "episode";
  rating: number | null; // stored 1..10
  runtimeMinutes: number | null;
  runtimeConfidence: RuntimeConfidence;
  countsTowardTime: boolean;
  tmdbId: number;
  genreIds: number[];
  releaseYear: number | null;
};

export type DiscoveryImpression = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  source: RecommendationSource;
  shownAt: Date;
  inRange: boolean;
  flags: {
    clicked: boolean;
    addedToWatchlist: boolean;
    markedWatched: boolean;
    rated: boolean;
    shared: boolean;
    dismissed: boolean;
  };
};

export type DiscoveryInteraction = {
  tmdbId: number;
  mediaType: "movie" | "tv" | null;
  type: string;
  createdAt: Date;
};

// TMDB genre ids → display names (movie + tv catalogs merged; ids are stable and
// non-overlapping except where the name is identical). `movies.genres` stores ids
// only, so taste analytics resolve names through this map.
export const GENRE_NAMES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

export function genreName(id: number): string {
  return GENRE_NAMES[id] ?? "Other";
}

const EPSILON = 1e-9;

// Stars (0.5..5) from the stored 1..10 scale, rounded to one decimal.
export function storedToStars(stored: number): number {
  return Math.round((stored / 2) * 10 + EPSILON) / 10;
}
