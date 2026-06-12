import type { MediaType, TmdbMovieSummary } from "@/lib/tmdb";

export type LikeKind = "like" | "favorite";

export interface MediaRef {
  tmdbId: number;
  mediaType: MediaType;
}

export interface LikeInput {
  tmdb_id: number;
  media_type: MediaType;
  kind: LikeKind;
}

export interface LikeItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  kind: LikeKind;
  created_at: string;
}

export interface LikeItemWithMedia extends LikeItem {
  media: TmdbMovieSummary;
}

export interface LikesPage {
  items: LikeItemWithMedia[];
  count: number;
}

export interface LikesListInput {
  kind?: LikeKind;
  mediaType?: MediaType;
  limit?: number;
  offset?: number;
}
