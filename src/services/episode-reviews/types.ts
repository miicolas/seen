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
}
