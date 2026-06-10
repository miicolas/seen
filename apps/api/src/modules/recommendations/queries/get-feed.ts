import { db } from "@seen/db";
import { feedEntries, movies as moviesTable } from "@seen/db/schema";
import { desc, eq, inArray } from "@seen/db/orm";

import { normalizeSummary } from "../../tmdb/normalize";
import { mediaKey } from "../../similarity/shared";
import { movieRowToSummary } from "./movie-row";
import type { RecommendationSource } from "../../events/shared";
import type { FeedResponseDto, FeedSectionDto } from "../model";
import { getCachedFeed, setCachedFeed } from "../cache";
import { storeFeed } from "../mutations/store-feed";
import { computeUserFeed, type FeedSectionKey } from "./compute-feed";
import { getProvidersForCandidates, getUserPlatformIds } from "./candidate-providers";

// Display order and the source the client credits for impressions per shelf.
const SECTIONS: { key: FeedSectionKey; source: RecommendationSource }[] = [
  { key: "today", source: "content" },
  { key: "because_you_rated", source: "content" },
  { key: "trending", source: "trending" },
  { key: "available_tonight", source: "availability" },
  { key: "discovery", source: "content" },
];

type StoredEntry = typeof feedEntries.$inferSelect;

// Serve the precomputed feed: Redis response cache → stored feed_entries batch
// → inline compute (brand-new user or region switch). The inline path stores
// its result so only the first request pays for it.
export async function getRecommendationFeed(
  userId: string,
  region: string,
): Promise<FeedResponseDto> {
  const cached = await getCachedFeed(userId, region);
  if (cached) return cached;

  let rows = await getStoredEntries(userId, region);
  let coldStart = false;
  if (rows === null) {
    const computed = await computeUserFeed(userId, region);
    await storeFeed(userId, region, computed);
    coldStart = computed.coldStart;
    rows = await getStoredEntries(userId, region);
  } else {
    coldStart = !rows.some((row) => row.source === "content" || row.source === "collaborative");
  }

  const response = await hydrate(userId, region, rows ?? [], coldStart);
  await setCachedFeed(userId, region, response);
  return response;
}

// The stored batch, or null when there is none for this user+region (a region
// switch invalidates the previous batch — the feed is availability-aware).
async function getStoredEntries(userId: string, region: string): Promise<StoredEntry[] | null> {
  const rows = await db
    .select()
    .from(feedEntries)
    .where(eq(feedEntries.userId, userId))
    .orderBy(desc(feedEntries.computedAt), feedEntries.rank);
  if (rows.length === 0) return null;
  if (rows[0].region !== region) return null;
  return rows;
}

async function hydrate(
  userId: string,
  region: string,
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

  const sections: FeedSectionDto[] = [];
  for (const { key, source } of SECTIONS) {
    const sectionRows = rows.filter((row) => row.section === key).sort((a, b) => a.rank - b.rank);
    if (sectionRows.length === 0) continue;

    const entries = [];
    for (const row of sectionRows) {
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
      key,
      source,
      anchorTitle: sectionRows[0].anchorTitle,
      entries,
    });
  }

  return {
    sections,
    coldStart,
    computedAt: rows[0]?.computedAt.toISOString() ?? null,
  };
}
