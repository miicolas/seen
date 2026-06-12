import type { MediaType } from "@/lib/tmdb";

export type AnalyticsRange = "week" | "month" | "year" | "all";
export type ShareTemplate = "weekly" | "taste" | "watchlist" | "stats";
export type RuntimeConfidence = "exact" | "estimated" | "unknown";
export type RecommendationSource =
  | "content"
  | "collaborative"
  | "trending"
  | "availability"
  | "social";

export interface WatchedTime {
  exact_minutes: number;
  estimated_minutes: number;
  unknown_count: number;
}

export interface Period {
  range: AnalyticsRange;
  timezone: string;
  from: string;
  to: string;
  previous_from: string | null;
  previous_to: string | null;
  is_current: boolean;
  has_previous: boolean;
}

export interface CurrentEra {
  decade: number | null;
  label: string;
  count: number;
  share: number;
}

export interface GenreCount {
  genre: string;
  count: number;
  share: number;
}

export interface WatchlistBacklog {
  count: number;
  movie_count: number;
  tv_count: number;
  added_in_range: number;
  watched_in_range: number;
  per_week: number;
  weeks_to_clear: number | null;
  oldest_added_at: string | null;
}

export interface Overview {
  period: Period;
  watched_time: WatchedTime;
  total_minutes: number;
  media_count: number;
  episode_count: number;
  average_rating: number | null;
  current_era: CurrentEra;
  previous: { total_minutes: number; media_count: number; episode_count: number };
  deltas: { minutes: number; media_count: number; minutes_pct: number | null };
  watchlist_backlog: WatchlistBacklog;
}

export interface TimelineBucket {
  key: string;
  label: string;
  watched_time: WatchedTime;
  total_minutes: number;
  media_count: number;
  episode_count: number;
  average_rating: number | null;
}

export interface BaselineBound {
  p25: number;
  p75: number;
}

export interface SeriesBaselines {
  watch_time: BaselineBound[] | null;
  titles: BaselineBound[] | null;
  episodes: BaselineBound[] | null;
  avg_rating: BaselineBound[] | null;
}

export interface MetricSummary {
  current: number;
  previous: number;
  delta: number;
  delta_pct: number | null;
}

export interface Series {
  period: Period;
  granularity: "day" | "month";
  buckets: TimelineBucket[];
  baselines: SeriesBaselines;
  summary: {
    watch_time: MetricSummary;
    titles: MetricSummary;
    episodes: MetricSummary;
    avg_rating: {
      current: number | null;
      previous: number | null;
      delta: number | null;
    };
  };
}

export interface Streaks {
  current_streak_days: number;
  longest_streak_days: number;
  longest_from: string | null;
  longest_to: string | null;
  active_today: boolean;
  last_30_days: boolean[];
}

export interface TimelineItem {
  kind: "media" | "episode";
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  rating: number | null;
  watched_at: string;
  runtime_minutes: number | null;
  season_number: number | null;
  episode_number: number | null;
}

export interface GenreRating {
  genre: string;
  avg_rating: number;
  count: number;
}

export interface DecadeCount {
  decade: number;
  label: string;
  count: number;
  share: number;
}

export interface RuntimeBucket {
  bucket: "short" | "medium" | "long";
  label: string;
  count: number;
}

export interface Taste {
  period: Period;
  total_logged: number;
  total_rated: number;
  genre_mix: GenreCount[];
  highest_rated_genres: GenreRating[];
  rating_distribution: number[];
  average_rating: number | null;
  decade_mix: DecadeCount[];
  runtime_mix: RuntimeBucket[];
  media_type_mix: { movie: number; tv: number };
  current_era: CurrentEra;
  contradictions: { id: string; label: string }[];
}

export interface DiscoverySourceFlow {
  source: RecommendationSource;
  impressions: number;
  detail_opens: number;
  watchlist_adds: number;
  reviews: number;
  ratings: number;
  likes_favorites: number;
  dismissals: number;
}

export interface DiscoveryFlow {
  period: Period;
  by_source: DiscoverySourceFlow[];
  totals: Omit<DiscoverySourceFlow, "source">;
}

export interface ShareRecap {
  template: ShareTemplate;
  period: Period;
  watched_time?: WatchedTime;
  total_minutes?: number;
  media_count?: number;
  episode_count?: number;
  average_rating?: number | null;
  top_genres?: GenreCount[];
  current_era?: CurrentEra;
  media_type_mix?: { movie: number; tv: number };
  total_logged?: number;
  buckets?: TimelineBucket[];
  streak?: Pick<Streaks, "current_streak_days" | "longest_streak_days" | "active_today">;
  sparkline_minutes?: number[];
  backlog?: {
    count: number;
    movie_count: number;
    tv_count: number;
    per_week: number;
    weeks_to_clear: number | null;
  };
}
