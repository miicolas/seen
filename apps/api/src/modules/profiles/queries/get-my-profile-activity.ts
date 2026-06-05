import { db } from "@seen/db";
import { episodeReviews, movies, reviews } from "@seen/db/schema";
import { desc, eq, inArray } from "drizzle-orm";

import { toApiRow } from "../../../lib/rows";

type MediaType = "movie" | "tv";

async function getMoviesForActivity(keys: { tmdbId: number; mediaType: MediaType }[]) {
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

function mediaSubtitle(movie: typeof movies.$inferSelect | undefined, mediaType: MediaType) {
  const label = mediaType === "tv" ? "Series" : "Movie";
  const year = movie?.releaseDate?.slice(0, 4);
  return year ? `${label} - ${year}` : label;
}

export async function getMyProfileActivity(userId: string, limit = 12) {
  const pageSize = Math.max(1, Math.min(50, limit));

  const [reviewRows, episodeRows] = await Promise.all([
    db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(pageSize),
    db
      .select()
      .from(episodeReviews)
      .where(eq(episodeReviews.userId, userId))
      .orderBy(desc(episodeReviews.createdAt))
      .limit(pageSize),
  ]);

  const movieMap = await getMoviesForActivity([
    ...reviewRows.map((review) => ({
      tmdbId: review.tmdbId,
      mediaType: review.mediaType as MediaType,
    })),
    ...episodeRows.map((episode) => ({
      tmdbId: episode.seriesTmdbId,
      mediaType: "tv" as const,
    })),
  ]);

  const mediaItems = reviewRows.map((review) => {
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
    });
  });

  const episodeItems = episodeRows.map((episode) => {
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
    });
  });

  return [...mediaItems, ...episodeItems]
    .sort(
      (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )
    .slice(0, pageSize);
}
