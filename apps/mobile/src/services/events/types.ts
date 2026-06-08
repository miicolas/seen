import type { MediaType } from "@/lib/tmdb";

export type InteractionEventType =
  | "opened_detail"
  | "viewed_trailer"
  | "searched"
  | "search_query"
  | "shared"
  | "clicked_streaming"
  | "added_watchlist"
  | "removed_watchlist"
  | "marked_watched"
  | "rated"
  | "reviewed"
  | "liked"
  | "dismissed"
  | "not_interested";

export type EventInput = {
  type: InteractionEventType;
  tmdbId?: number;
  mediaType?: MediaType;
  metadata?: Record<string, unknown>;
};

export type InteractionEventPayload = {
  type: InteractionEventType;
  tmdb_id?: number;
  media_type?: MediaType;
  metadata?: Record<string, unknown>;
};
