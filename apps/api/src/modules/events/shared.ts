import type { recommendationEvents } from "@seen/db/schema";

import type { MediaType } from "../tmdb";

export const INTERACTION_EVENT_TYPES = [
  "opened_detail",
  "viewed_trailer",
  "searched",
  "search_query",
  "shared",
  "clicked_streaming",
  "added_watchlist",
  "removed_watchlist",
  "marked_watched",
  "rated",
  "reviewed",
  "liked",
  "dismissed",
  "not_interested",
] as const;

export type InteractionEventType = (typeof INTERACTION_EVENT_TYPES)[number];

export const RECOMMENDATION_SOURCES = [
  "content",
  "collaborative",
  "trending",
  "availability",
  "social",
] as const;

export type RecommendationSource = (typeof RECOMMENDATION_SOURCES)[number];

export type InteractionEventInput = {
  type: InteractionEventType;
  tmdb_id?: number;
  media_type?: MediaType;
  metadata?: unknown;
};

export type ImpressionInput = {
  tmdb_id: number;
  media_type: MediaType;
  source: RecommendationSource;
  position: number;
};

export type OutcomeInput = {
  id: string;
  clicked?: boolean;
  added_to_watchlist?: boolean;
  marked_watched?: boolean;
  rated?: boolean;
  shared?: boolean;
  dismissed?: boolean;
  time_spent_ms?: number;
};

export function toRecommendationEvent(row: typeof recommendationEvents.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    tmdb_id: row.tmdbId,
    media_type: row.mediaType as MediaType,
    source: row.source as RecommendationSource,
    position: row.position,
    shown_at: row.shownAt.toISOString(),
    clicked: row.clicked,
    added_to_watchlist: row.addedToWatchlist,
    marked_watched: row.markedWatched,
    rated: row.rated,
    shared: row.shared,
    dismissed: row.dismissed,
    time_spent_ms: row.timeSpentMs,
  };
}
