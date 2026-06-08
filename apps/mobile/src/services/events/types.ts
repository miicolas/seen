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

// Which recommendation surface an item was shown on. Mirrors the API's source enum.
export type RecommendationSource =
  | "content"
  | "collaborative"
  | "trending"
  | "availability"
  | "social";

export type ImpressionInput = {
  tmdbId: number;
  mediaType: MediaType;
  source: RecommendationSource;
  position: number;
  // Distinguishes the shelf instance the card was shown in. Used only for client
  // dedupe (never sent to the server): the same title can legitimately appear in
  // two shelves that share a source (e.g. several "content" rows), and those are
  // genuinely two impressions — without a scope they'd collide on source+position.
  scope: string;
};

export type ImpressionPayload = {
  tmdb_id: number;
  media_type: MediaType;
  source: RecommendationSource;
  position: number;
};
