import { db } from "@seen/db";
import { episodeReviews, movies, reviews } from "@seen/db/schema";
import { and, eq, gte, lt } from "@seen/db/orm";

import type { RuntimeConfidence, WatchEntry } from "../shared";

function genreIdsOf(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((id): id is number => typeof id === "number") : [];
}

function yearOf(releaseDate: unknown): number | null {
  if (typeof releaseDate === "string" && releaseDate.length >= 4) {
    const year = Number(releaseDate.slice(0, 4));
    return Number.isFinite(year) ? year : null;
  }
  if (releaseDate instanceof Date) return releaseDate.getUTCFullYear();
  return null;
}

// All of a user's watched things in [from, to), normalized to WatchEntry. Movie
// reviews carry TMDB runtime (exact); tv reviews are a log only (no minutes);
// episode reviews carry their recorded runtime snapshot. Genres/year come from the
// joined `movies` row (the series row for episodes).
export async function fetchWatchEntries(
  userId: string,
  fromISO: string,
  toISO: string,
): Promise<WatchEntry[]> {
  const from = new Date(fromISO);
  const to = new Date(toISO);

  const [reviewRows, episodeRows] = await Promise.all([
    db
      .select({
        watchedAt: reviews.watchedAt,
        mediaType: reviews.mediaType,
        rating: reviews.rating,
        tmdbId: reviews.tmdbId,
        runtime: movies.runtime,
        genres: movies.genres,
        releaseDate: movies.releaseDate,
      })
      .from(reviews)
      .leftJoin(
        movies,
        and(eq(reviews.tmdbId, movies.tmdbId), eq(reviews.mediaType, movies.mediaType)),
      )
      .where(
        and(eq(reviews.userId, userId), gte(reviews.watchedAt, from), lt(reviews.watchedAt, to)),
      ),
    db
      .select({
        watchedAt: episodeReviews.watchedAt,
        rating: episodeReviews.rating,
        seriesTmdbId: episodeReviews.seriesTmdbId,
        runtimeMinutes: episodeReviews.runtimeMinutes,
        runtimeConfidence: episodeReviews.runtimeConfidence,
        genres: movies.genres,
        releaseDate: movies.releaseDate,
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
      ),
  ]);

  const entries: WatchEntry[] = [];

  for (const row of reviewRows) {
    const mediaType = row.mediaType === "tv" ? "tv" : "movie";
    const countsTowardTime = mediaType === "movie";
    const hasRuntime = Boolean(row.runtime && row.runtime > 0);
    entries.push({
      watchedAt: row.watchedAt,
      mediaType,
      kind: "media",
      rating: row.rating ?? null,
      runtimeMinutes: countsTowardTime && hasRuntime ? row.runtime : null,
      runtimeConfidence: countsTowardTime && hasRuntime ? "exact" : "unknown",
      countsTowardTime,
      tmdbId: row.tmdbId,
      genreIds: genreIdsOf(row.genres),
      releaseYear: yearOf(row.releaseDate),
    });
  }

  for (const row of episodeRows) {
    entries.push({
      watchedAt: row.watchedAt,
      mediaType: "tv",
      kind: "episode",
      rating: row.rating ?? null,
      runtimeMinutes: row.runtimeMinutes ?? null,
      runtimeConfidence: (row.runtimeConfidence as RuntimeConfidence) ?? "unknown",
      countsTowardTime: true,
      tmdbId: row.seriesTmdbId,
      genreIds: genreIdsOf(row.genres),
      releaseYear: yearOf(row.releaseDate),
    });
  }

  return entries;
}
