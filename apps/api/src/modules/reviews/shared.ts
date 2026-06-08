import { reviews } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import type { MediaType } from "../tmdb";

export type ReviewInput = {
  tmdb_id: number;
  media_type: MediaType;
  rating?: number | null;
  title?: string | null;
  comment?: string | null;
  watched_at?: string | null;
};

export function mediaWhere(tmdbId: number, mediaType: MediaType) {
  return and(eq(reviews.tmdbId, tmdbId), eq(reviews.mediaType, mediaType));
}
