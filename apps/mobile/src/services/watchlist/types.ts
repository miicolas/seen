import type { MediaFilter, MediaType, TmdbMovieSummary } from "@/lib/tmdb";

export interface MediaRef {
  tmdbId: number;
  mediaType: MediaType;
}

export interface WatchlistInput {
  tmdb_id: number;
  media_type: MediaType;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  added_at: string;
  visibility: "private";
}

export interface WatchlistItemWithMedia extends WatchlistItem {
  media: TmdbMovieSummary;
}

export interface WatchlistPage {
  items: WatchlistItemWithMedia[];
  count: number;
}

export interface WatchlistListInput {
  filter: MediaFilter;
  search?: string;
  limit: number;
  offset: number;
}
