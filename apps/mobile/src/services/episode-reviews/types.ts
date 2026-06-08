export interface EpisodeReview {
  id: string;
  user_id: string;
  series_tmdb_id: number;
  episode_tmdb_id: number;
  season_number: number;
  episode_number: number;
  rating: number | null;
  title: string | null;
  comment: string | null;
  runtime_minutes: number | null;
  runtime_confidence: "exact" | "estimated" | "unknown";
  watched_at: string;
  created_at: string;
  updated_at: string;
}

export interface EpisodeReviewInput {
  series_tmdb_id: number;
  episode_tmdb_id: number;
  season_number: number;
  episode_number: number;
  rating?: number | null;
  title?: string | null;
  comment?: string | null;
  // ISO date the user watched it; omitted keeps the existing/default date.
  watched_at?: string | null;
}
