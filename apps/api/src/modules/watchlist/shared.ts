import { movies, watchlist } from "@seen/db/schema";
import { and, eq } from "drizzle-orm";

import type { MediaType, TmdbMovieSummary } from "../tmdb";

export type WatchlistInput = {
  tmdb_id: number;
  media_type: MediaType;
};

export function watchlistMediaWhere(userId: string, tmdbId: number, mediaType: MediaType) {
  return and(
    eq(watchlist.userId, userId),
    eq(watchlist.tmdbId, tmdbId),
    eq(watchlist.mediaType, mediaType),
  );
}

export function toMediaSummary(row: typeof movies.$inferSelect): TmdbMovieSummary {
  return {
    id: row.tmdbId,
    media_type: row.mediaType as MediaType,
    title: row.title,
    original_title: row.originalTitle ?? undefined,
    overview: row.overview ?? undefined,
    release_date: row.releaseDate ?? undefined,
    runtime: row.runtime ?? undefined,
    poster_path: row.posterPath,
    backdrop_path: row.backdropPath,
    vote_average: row.voteAverage ?? undefined,
    vote_count: row.voteCount ?? undefined,
    popularity: row.popularity ?? undefined,
    genre_ids: Array.isArray(row.genres) ? (row.genres as number[]) : undefined,
  };
}

export function toWatchlistItem(row: typeof watchlist.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    tmdb_id: row.tmdbId,
    media_type: row.mediaType as MediaType,
    added_at: row.addedAt.toISOString(),
    visibility: "private" as const,
  };
}

export function toWatchlistItemWithMedia(row: {
  watchlist: typeof watchlist.$inferSelect;
  media: typeof movies.$inferSelect;
}) {
  return {
    ...toWatchlistItem(row.watchlist),
    media: toMediaSummary(row.media),
  };
}
