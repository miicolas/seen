import { db } from "@seen/db";
import { episodeReviews, follows, movies, profiles, reviews } from "@seen/db/schema";
import { desc, eq, inArray } from "@seen/db/orm";

import { toApiRow } from "../../lib/rows";
import { getViewerState, getViewerStates, normalizePagination, toProfileCard } from "./shared";

type MediaType = "movie" | "tv";

async function getMoviesFor(keys: { tmdbId: number; mediaType: MediaType }[]) {
  const ids = [...new Set(keys.map((key) => key.tmdbId))];
  const allowed = new Set(keys.map((key) => `${key.tmdbId}:${key.mediaType}`));
  if (!ids.length) return new Map<string, typeof movies.$inferSelect>();
  const rows = await db.select().from(movies).where(inArray(movies.tmdbId, ids));
  return new Map(
    rows
      .filter((movie) => allowed.has(`${movie.tmdbId}:${movie.mediaType}`))
      .map((movie) => [`${movie.tmdbId}:${movie.mediaType}`, movie]),
  );
}

// Author cards for the activity feed, resolved relative to the viewer so each
// row carries follow state for its author.
async function getAuthorCards(viewerId: string, authorIds: string[]) {
  const ids = [...new Set(authorIds)];
  if (!ids.length) return new Map<string, ReturnType<typeof toProfileCard>>();
  const [rows, states] = await Promise.all([
    db.select().from(profiles).where(inArray(profiles.id, ids)),
    getViewerStates(viewerId, ids),
  ]);
  const map = new Map<string, ReturnType<typeof toProfileCard>>();
  for (const row of rows) {
    map.set(row.id, toProfileCard(row, viewerId, getViewerState(states, row.id)));
  }
  return map;
}

function mediaSubtitle(movie: typeof movies.$inferSelect | undefined, mediaType: MediaType) {
  const label = mediaType === "tv" ? "Series" : "Movie";
  const year = movie?.releaseDate?.slice(0, 4);
  return year ? `${label} - ${year}` : label;
}

// Merge review + episode-review activity for a set of authors into one feed,
// newest first, with the author card attached to every item.
export async function buildActivityFeed(
  viewerId: string,
  authorIds: string[],
  limit: number,
  offset: number,
) {
  const { pageSize, offset: from } = normalizePagination(limit, offset);
  const window = from + pageSize;
  const authors = [...new Set(authorIds)];
  if (authors.length === 0) return [];

  const [reviewRows, episodeRows] = await Promise.all([
    db
      .select()
      .from(reviews)
      .where(inArray(reviews.userId, authors))
      .orderBy(desc(reviews.createdAt))
      .limit(window),
    db
      .select()
      .from(episodeReviews)
      .where(inArray(episodeReviews.userId, authors))
      .orderBy(desc(episodeReviews.createdAt))
      .limit(window),
  ]);

  const [movieMap, authorCards] = await Promise.all([
    getMoviesFor([
      ...reviewRows.map((review) => ({
        tmdbId: review.tmdbId,
        mediaType: review.mediaType as MediaType,
      })),
      ...episodeRows.map((episode) => ({ tmdbId: episode.seriesTmdbId, mediaType: "tv" as const })),
    ]),
    getAuthorCards(viewerId, [
      ...reviewRows.map((review) => review.userId),
      ...episodeRows.map((episode) => episode.userId),
    ]),
  ]);

  const mediaItems = reviewRows
    .filter((review) => authorCards.has(review.userId))
    .map((review) => {
      const mediaType = review.mediaType as MediaType;
      const movie = movieMap.get(`${review.tmdbId}:${mediaType}`);
      return toApiRow({
        id: review.id,
        kind: "media" as const,
        createdAt: review.createdAt,
        rating: review.rating,
        reviewTitle: review.title,
        comment: review.comment,
        mediaTitle: movie?.title ?? (mediaType === "tv" ? "Series" : "Movie"),
        mediaSubtitle: mediaSubtitle(movie, mediaType),
        posterPath: movie?.posterPath ?? null,
        mediaType,
        tmdbId: review.tmdbId,
        seasonNumber: null,
        episodeNumber: null,
        episodeTmdbId: null,
        author: authorCards.get(review.userId),
      });
    });

  const episodeItems = episodeRows
    .filter((episode) => authorCards.has(episode.userId))
    .map((episode) => {
      const series = movieMap.get(`${episode.seriesTmdbId}:tv`);
      return toApiRow({
        id: episode.id,
        kind: "episode" as const,
        createdAt: episode.createdAt,
        rating: episode.rating,
        reviewTitle: episode.title,
        comment: episode.comment,
        mediaTitle: series?.title ?? "Series",
        mediaSubtitle: `Season ${episode.seasonNumber} - Episode ${episode.episodeNumber}`,
        posterPath: series?.posterPath ?? null,
        mediaType: "tv" as const,
        tmdbId: episode.seriesTmdbId,
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
        episodeTmdbId: episode.episodeTmdbId,
        author: authorCards.get(episode.userId),
      });
    });

  return [...mediaItems, ...episodeItems]
    .sort(
      (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )
    .slice(from, from + pageSize);
}

// The ids of everyone `userId` follows.
export async function getFolloweeIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: follows.followeeId })
    .from(follows)
    .where(eq(follows.followerId, userId));
  return rows.map((row) => row.id);
}
