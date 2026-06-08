import type { MediaType } from "@/lib/tmdb";

// Identifies one media item across the review handlers.
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
  watched_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewInput {
  tmdb_id: number;
  media_type: MediaType;
  rating?: number | null;
  title?: string | null;
  comment?: string | null;
  // ISO date the user watched it; omitted keeps the existing/default date.
  watched_at?: string | null;
}

export interface MediaReviewStats {
  tmdb_id: number;
  media_type: MediaType;
  rating_count: number;
  avg_rating: number | null; // 0.5..5 scale
  review_count: number;
  // 10 half-star buckets (index 0 = 0.5★ … 9 = 5★), maintained server-side.
  histogram: number[] | null;
}

export interface MediaReviewsPage {
  reviews: Review[];
  count: number;
}

// Zeroed 10 half-star buckets — fallback when a stats row has no histogram yet.
export const EMPTY_HISTOGRAM: number[] = new Array(10).fill(0);
