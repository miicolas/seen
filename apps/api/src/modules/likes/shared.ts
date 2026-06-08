import { likes, movies } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import type { MediaType } from "../tmdb";
import { toMediaSummary } from "../watchlist/shared";

export type LikeKind = "like" | "favorite";

export type LikeInput = {
  tmdb_id: number;
  media_type: MediaType;
  kind: LikeKind;
};

export function likeMediaWhere(
  userId: string,
  tmdbId: number,
  mediaType: MediaType,
  kind: LikeKind,
) {
  return and(
    eq(likes.userId, userId),
    eq(likes.tmdbId, tmdbId),
    eq(likes.mediaType, mediaType),
    eq(likes.kind, kind),
  );
}

export function toLikeItem(row: typeof likes.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    tmdb_id: row.tmdbId,
    media_type: row.mediaType as MediaType,
    kind: row.kind as LikeKind,
    created_at: row.createdAt.toISOString(),
  };
}

export function toLikeItemWithMedia(row: {
  likes: typeof likes.$inferSelect;
  media: typeof movies.$inferSelect;
}) {
  return {
    ...toLikeItem(row.likes),
    media: toMediaSummary(row.media),
  };
}
