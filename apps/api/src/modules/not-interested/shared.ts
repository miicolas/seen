import { notInterested } from "@seen/db/schema";
import { and, eq } from "drizzle-orm";

import type { MediaType } from "../tmdb";

export type NotInterestedInput = {
  tmdb_id: number;
  media_type: MediaType;
  reason?: string;
};

export function notInterestedWhere(userId: string, tmdbId: number, mediaType: MediaType) {
  return and(
    eq(notInterested.userId, userId),
    eq(notInterested.tmdbId, tmdbId),
    eq(notInterested.mediaType, mediaType),
  );
}

export function toNotInterestedItem(row: typeof notInterested.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    tmdb_id: row.tmdbId,
    media_type: row.mediaType as MediaType,
    reason: row.reason ?? null,
    created_at: row.createdAt.toISOString(),
  };
}
