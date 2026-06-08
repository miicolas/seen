import { db } from "@seen/db";
import { episodeReviews, movies, reviews } from "@seen/db/schema";
import { and, desc, eq, gte, lt } from "@seen/db/orm";

import { HttpError } from "../../../lib/http-error";
import { storedToStars } from "../shared";

export type TimelineItem = {
  kind: "media" | "episode";
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  rating: number | null;
  watched_at: string;
  runtime_minutes: number | null;
  season_number: number | null;
  episode_number: number | null;
};

const MAX_ITEMS = 200;

function parseInstant(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, `Invalid ${field} timestamp.`);
  return date;
}

// The titles behind one timeline bucket — what you actually watched that day/month,
// returned newest first for the drill-down sheet.
export async function getTimelineItems(
  userId: string,
  fromISO: string,
  toISO: string,
): Promise<{ items: TimelineItem[] }> {
  const from = parseInstant(fromISO, "from");
  const to = parseInstant(toISO, "to");

  const [reviewRows, episodeRows] = await Promise.all([
    db
      .select({
        tmdbId: reviews.tmdbId,
        mediaType: reviews.mediaType,
        rating: reviews.rating,
        watchedAt: reviews.watchedAt,
        title: movies.title,
        posterPath: movies.posterPath,
        runtime: movies.runtime,
      })
      .from(reviews)
      .leftJoin(
        movies,
        and(eq(reviews.tmdbId, movies.tmdbId), eq(reviews.mediaType, movies.mediaType)),
      )
      .where(and(eq(reviews.userId, userId), gte(reviews.watchedAt, from), lt(reviews.watchedAt, to)))
      .orderBy(desc(reviews.watchedAt))
      .limit(MAX_ITEMS),
    db
      .select({
        seriesTmdbId: episodeReviews.seriesTmdbId,
        seasonNumber: episodeReviews.seasonNumber,
        episodeNumber: episodeReviews.episodeNumber,
        rating: episodeReviews.rating,
        watchedAt: episodeReviews.watchedAt,
        runtimeMinutes: episodeReviews.runtimeMinutes,
        title: movies.title,
        posterPath: movies.posterPath,
      })
      .from(episodeReviews)
      .leftJoin(
        movies,
        and(eq(episodeReviews.seriesTmdbId, movies.tmdbId), eq(movies.mediaType, "tv")),
      )
      .where(
        and(
          eq(episodeReviews.userId, userId),
          gte(episodeReviews.watchedAt, from),
          lt(episodeReviews.watchedAt, to),
        ),
      )
      .orderBy(desc(episodeReviews.watchedAt))
      .limit(MAX_ITEMS),
  ]);

  const items: TimelineItem[] = [];

  for (const row of reviewRows) {
    items.push({
      kind: "media",
      tmdb_id: row.tmdbId,
      media_type: row.mediaType === "tv" ? "tv" : "movie",
      title: row.title ?? "Untitled",
      poster_path: row.posterPath ?? null,
      rating: row.rating != null ? storedToStars(row.rating) : null,
      watched_at: row.watchedAt.toISOString(),
      runtime_minutes: row.mediaType === "movie" ? (row.runtime ?? null) : null,
      season_number: null,
      episode_number: null,
    });
  }

  for (const row of episodeRows) {
    items.push({
      kind: "episode",
      tmdb_id: row.seriesTmdbId,
      media_type: "tv",
      title: row.title ?? "Untitled",
      poster_path: row.posterPath ?? null,
      rating: row.rating != null ? storedToStars(row.rating) : null,
      watched_at: row.watchedAt.toISOString(),
      runtime_minutes: row.runtimeMinutes ?? null,
      season_number: row.seasonNumber,
      episode_number: row.episodeNumber,
    });
  }

  items.sort((a, b) => b.watched_at.localeCompare(a.watched_at));
  return { items: items.slice(0, MAX_ITEMS) };
}
