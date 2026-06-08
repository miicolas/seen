import { db } from "@seen/db";
import { likes, notInterested, reviews, watchlist } from "@seen/db/schema";
import { and, eq, inArray } from "@seen/db/orm";

import { getMediaDetail } from "../../tmdb";
import type { MovieDetailDto } from "../../tmdb/model";
import type { SeedItemDto } from "../model";
import { SEED_TITLES } from "../seed";

// Titles the user has already acted on — we never ask "seen this?" about them.
async function getSeenKeys(userId: string, tmdbIds: number[]): Promise<Set<string>> {
  if (tmdbIds.length === 0) return new Set();

  const [reviewed, listed, liked, dismissed] = await Promise.all([
    db
      .select({ tmdbId: reviews.tmdbId, mediaType: reviews.mediaType })
      .from(reviews)
      .where(and(eq(reviews.userId, userId), inArray(reviews.tmdbId, tmdbIds))),
    db
      .select({ tmdbId: watchlist.tmdbId, mediaType: watchlist.mediaType })
      .from(watchlist)
      .where(and(eq(watchlist.userId, userId), inArray(watchlist.tmdbId, tmdbIds))),
    db
      .select({ tmdbId: likes.tmdbId, mediaType: likes.mediaType })
      .from(likes)
      .where(and(eq(likes.userId, userId), inArray(likes.tmdbId, tmdbIds))),
    db
      .select({ tmdbId: notInterested.tmdbId, mediaType: notInterested.mediaType })
      .from(notInterested)
      .where(and(eq(notInterested.userId, userId), inArray(notInterested.tmdbId, tmdbIds))),
  ]);

  const seen = new Set<string>();
  for (const rows of [reviewed, listed, liked, dismissed]) {
    for (const row of rows) seen.add(`${row.mediaType}:${row.tmdbId}`);
  }
  return seen;
}

function toSeedItem(detail: MovieDetailDto): SeedItemDto {
  return {
    id: detail.id,
    media_type: detail.media_type,
    title: detail.title,
    original_title: detail.original_title,
    overview: detail.overview,
    release_date: detail.release_date,
    poster_path: detail.poster_path ?? null,
    backdrop_path: detail.backdrop_path ?? null,
    vote_average: detail.vote_average,
    genre_ids: detail.genre_ids ?? detail.genres?.map((genre) => genre.id),
  };
}

// Returns the curated seed (already-seen titles removed), resolved to cards via
// the TMDB cache, in the diverse round-robin order. The client slices ~8/~18.
export async function getOnboardingSeed(userId: string): Promise<SeedItemDto[]> {
  const seen = await getSeenKeys(
    userId,
    SEED_TITLES.map((entry) => entry.tmdbId),
  );
  const remaining = SEED_TITLES.filter((entry) => !seen.has(`${entry.mediaType}:${entry.tmdbId}`));

  const items = await Promise.all(
    remaining.map(async (entry) => {
      try {
        return toSeedItem(await getMediaDetail(entry.mediaType, entry.tmdbId));
      } catch {
        return null;
      }
    }),
  );

  return items.filter((item): item is SeedItemDto => item !== null);
}
