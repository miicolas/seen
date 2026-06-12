import type { RecommendationSource } from "../events/shared";

export type AnalyticsRange = "week" | "month" | "year" | "all";

export const round = (value: number, places = 2) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

export const ANALYTICS_RANGES: AnalyticsRange[] = ["week", "month", "year", "all"];

export type RuntimeConfidence = "exact" | "estimated" | "unknown";

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
  is_current: boolean;
  has_previous: boolean;
};

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

export function storedToStars(stored: number): number {
  return Math.round((stored / 2) * 10 + EPSILON) / 10;
}
