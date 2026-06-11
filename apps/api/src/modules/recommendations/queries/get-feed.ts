import { db } from "@seen/db";
import { feedEntries, movies as moviesTable } from "@seen/db/schema";
import { desc, eq, inArray } from "@seen/db/orm";

import { normalizeSummary } from "../../tmdb/normalize";
import { mediaKey } from "../../similarity/shared";
import { listResumeSessions } from "../../watch-sessions/queries/list-resume-sessions";
import { movieRowToSummary } from "./movie-row";
import { getFriendsRecentlyWatched } from "./friends-recently-watched";
import type { RecommendationSource } from "../../events/shared";
import type { FeedResponseDto, FeedSectionDto, ResumeEntryDto } from "../model";
import { DEFAULT_FEED_SALT, getCachedFeed, setCachedFeed } from "../cache";
import { passesQualityGate } from "../quality-gate";
import type { ScoreComponents } from "../scoring";
import { storeFeed } from "../mutations/store-feed";
import { computeUserFeed } from "./compute-feed";
import { sectionizePool } from "./sectionize-pool";
import { getProvidersForCandidates, getUserPlatformIds } from "./candidate-providers";

type StoredEntry = typeof feedEntries.$inferSelect;

// Serve the precomputed feed: Redis response cache → stored candidate pool
// sliced into sections with the request's refresh salt → inline compute
// (brand-new user, region switch, or legacy sectionized batch). The inline path
// stores its result so only the first request pays for it. A new salt (every
// pull-to-refresh) resamples the same pool into a visibly different feed.
export async function getRecommendationFeed(
  userId: string,
  region: string,
  salt = DEFAULT_FEED_SALT,
): Promise<FeedResponseDto> {
  const cached = await getCachedFeed(userId, region, salt);
  if (cached) return withServeTimeSections(userId, cached);

  let rows = await getStoredPool(userId, region);
  let coldStart = false;
  if (rows === null) {
    const computed = await computeUserFeed(userId, region);
    await storeFeed(userId, region, computed);
    coldStart = computed.coldStart;
    rows = await getStoredPool(userId, region);
  } else {
    coldStart = !rows.some((row) => row.source === "content" || row.source === "collaborative");
  }

  const response = await hydrate(userId, region, salt, rows ?? [], coldStart);
  await setCachedFeed(userId, region, salt, response);
  return withServeTimeSections(userId, response);
}

async function withServeTimeSections(
  userId: string,
  response: FeedResponseDto,
): Promise<FeedResponseDto> {
  const [resume, friendsRecentlyWatched] = await Promise.all([
    listResumeSessions(userId)
      .then((sessions) =>
        sessions.map(
          (session): ResumeEntryDto => ({
            session_id: session.id,
            media_type: session.media_type as ResumeEntryDto["media_type"],
            tmdb_id: session.tmdb_id,
            season_number: session.season_number,
            episode_number: session.episode_number,
            title: session.title,
            poster_path: session.poster_path,
            status: session.me.status,
            position_seconds: session.me.position_seconds,
            duration_seconds: session.me.duration_seconds,
            last_progress_at: session.me.last_progress_at,
          }),
        ),
      )
      .catch(() => []),
    getFriendsRecentlyWatched(userId).catch(() => []),
  ]);
  return { ...response, resume, friendsRecentlyWatched };
}

// The stored pool, or null when there is none for this user+region (a region
// switch invalidates the previous batch — the feed is availability-aware — and
// a pre-pool sectionized batch is recomputed on first read).
async function getStoredPool(userId: string, region: string): Promise<StoredEntry[] | null> {
  const rows = await db
    .select()
    .from(feedEntries)
    .where(eq(feedEntries.userId, userId))
    .orderBy(desc(feedEntries.computedAt), feedEntries.rank);
  if (rows.length === 0) return null;
  if (rows[0].region !== region) return null;
  const pool = rows.filter((row) => row.section === "pool");
  if (pool.length === 0) return null;
  return pool;
}

async function hydrate(
  userId: string,
  region: string,
  salt: string,
  rows: StoredEntry[],
  coldStart: boolean,
): Promise<FeedResponseDto> {
  const tmdbIds = [...new Set(rows.map((row) => row.tmdbId))];
  const [movieRows, providersByKey, userPlatformIds] = await Promise.all([
    tmdbIds.length
      ? db.select().from(moviesTable).where(inArray(moviesTable.tmdbId, tmdbIds))
      : Promise.resolve([]),
    getProvidersForCandidates(rows, region),
    getUserPlatformIds(userId, region),
  ]);
  const moviesByKey = new Map(movieRows.map((row) => [mediaKey(row.tmdbId, row.mediaType), row]));
  const platformIds = new Set(userPlatformIds);

  // Belt-and-braces: re-apply the quality gate at serve time so a stored batch
  // can never surface unreleased/unrated titles.
  const pool = rows
    .filter((row) => {
      const movie = moviesByKey.get(mediaKey(row.tmdbId, row.mediaType));
      return movie !== undefined && passesQualityGate(movie);
    })
    .map((row) => ({ ...row, components: (row.components ?? null) as ScoreComponents | null }));

  const sections: FeedSectionDto[] = [];
  for (const section of sectionizePool(pool, `${userId}:${region}:${salt}`)) {
    const entries = [];
    for (const row of section.rows) {
      const movie = moviesByKey.get(mediaKey(row.tmdbId, row.mediaType));
      if (!movie) continue;
      const providers = (providersByKey.get(mediaKey(row.tmdbId, row.mediaType)) ?? []).filter(
        (provider) => platformIds.has(provider.providerId),
      );
      const summary = movieRowToSummary(movie);
      entries.push({
        ...normalizeSummary(summary, summary.media_type),
        source: row.source as RecommendationSource,
        providers,
      });
    }
    if (entries.length === 0) continue;

    sections.push({
      key: section.key,
      source: section.source,
      anchorTitle: section.anchorTitle,
      entries,
    });
  }

  return {
    sections,
    coldStart,
    computedAt: rows[0]?.computedAt.toISOString() ?? null,
  };
}
