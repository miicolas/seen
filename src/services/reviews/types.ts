import type { MediaType } from "@/lib/tmdb";

// Identifies one movie/series across the review handlers.
export interface MediaRef {
  tmdbId: number;
  mediaType: MediaType;
}

export interface PaginatedMediaRef extends MediaRef {
  limit: number;
  offset: number;
}

// rating is the stored 1..10 half-star scale (divide by 2 for display stars).
export interface Review {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  rating: number | null;
  title: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewInput {
  tmdb_id: number;
  media_type: MediaType;
  rating?: number | null;
  title?: string | null;
  comment?: string | null;
}

export interface MovieReviewStats {
  tmdb_id: number;
  media_type: MediaType;
  rating_count: number;
  avg_rating: number | null; // 0.5..5 scale
  review_count: number;
}

export interface MovieReviewsPage {
  reviews: Review[];
  count: number;
}
