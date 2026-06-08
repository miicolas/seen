import { db } from "@seen/db";
import {
  mediaProviders,
  movies as moviesTable,
  providers as providersTable,
  userPlatforms,
  watchlist,
} from "@seen/db/schema";
import { and, eq, inArray } from "@seen/db/orm";

import { byDisplayPriority } from "../../../lib/sort";
import { normalizeSummary, trending } from "../../tmdb/client";
import { getMediaDetail } from "../../tmdb/queries/media-detail";
import type { MediaFilter, TmdbMovieSummary } from "../../tmdb";
import type { AvailableEntryDto } from "../model";

// Cap on how many cache-cold titles we warm per request, so a fresh feed
// populates itself over a few loads without fanning out to TMDB unbounded.
const MAX_WARM_PER_REQUEST = 16;

const SHORT_MOVIE_RUNTIME_MAX = 100;
const TV_EPISODE_RUNTIME_MAX = 45;

type Candidate = {
  summary: TmdbMovieSummary;
  runtime: number | null;
};

async function getUserPlatformIds(userId: string, region: string): Promise<number[]> {
  const rows = await db
    .select({ providerId: userPlatforms.providerId })
    .from(userPlatforms)
    .where(and(eq(userPlatforms.userId, userId), eq(userPlatforms.region, region)));
  return rows.map((row) => row.providerId);
}

async function getWatchlistCandidates(userId: string, filter: MediaFilter): Promise<Candidate[]> {
  const where = and(
    eq(watchlist.userId, userId),
    filter === "all" ? undefined : eq(watchlist.mediaType, filter),
  );

  const rows = await db
    .select({ media: moviesTable })
    .from(watchlist)
    .innerJoin(
      moviesTable,
      and(eq(watchlist.tmdbId, moviesTable.tmdbId), eq(watchlist.mediaType, moviesTable.mediaType)),
    )
    .where(where);

  return rows.map(({ media }) => ({
    summary: {
      id: media.tmdbId,
      media_type: media.mediaType as "movie" | "tv",
      title: media.title ?? undefined,
      original_title: media.originalTitle ?? undefined,
      overview: media.overview ?? undefined,
      release_date: media.releaseDate ?? undefined,
      runtime: media.runtime ?? null,
      poster_path: media.posterPath ?? null,
      backdrop_path: media.backdropPath ?? null,
      vote_average: media.voteAverage ?? undefined,
      vote_count: media.voteCount ?? undefined,
      popularity: media.popularity ?? undefined,
      genre_ids: Array.isArray(media.genres) ? (media.genres as number[]) : undefined,
    },
    runtime: media.runtime ?? null,
  }));
}

async function getTrendingCandidates(filter: MediaFilter): Promise<Candidate[]> {
  const list = await trending(filter, "week");
  return list.map((summary) => ({ summary, runtime: summary.runtime ?? null }));
}

// Trending summaries carry no runtime, so back-fill it from the movies cache
// (populated whenever a detail is viewed); without this the short shelf can only
// ever surface watchlist titles.
async function fillRuntimes(candidates: Candidate[]): Promise<void> {
  const missing = candidates.filter((candidate) => candidate.runtime === null);
  if (missing.length === 0) return;
  const ids = missing.map((candidate) => candidate.summary.id);
  const rows = await db
    .select({
      tmdbId: moviesTable.tmdbId,
      mediaType: moviesTable.mediaType,
      runtime: moviesTable.runtime,
    })
    .from(moviesTable)
    .where(inArray(moviesTable.tmdbId, ids));

  const byKey = new Map<string, number>();
  for (const row of rows) {
    if (row.runtime !== null) byKey.set(`${row.mediaType}:${row.tmdbId}`, row.runtime);
  }
  for (const candidate of missing) {
    const runtime = byKey.get(`${candidate.summary.media_type}:${candidate.summary.id}`);
    if (runtime !== undefined) candidate.runtime = runtime;
  }
}

// Fire-and-forget warm for titles with no cached availability, so a cold feed
// fills in over the next few loads instead of staying empty.
function warmMissingProviders(
  candidates: Candidate[],
  providersByKey: ReadonlyMap<string, unknown>,
): void {
  const missing = candidates
    .filter(
      (candidate) => !providersByKey.has(`${candidate.summary.media_type}:${candidate.summary.id}`),
    )
    .slice(0, MAX_WARM_PER_REQUEST);
  for (const candidate of missing) {
    void getMediaDetail(candidate.summary.media_type, candidate.summary.id).catch(() => {});
  }
}

function dedup(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const candidate of candidates) {
    const key = `${candidate.summary.media_type}:${candidate.summary.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
  }
  return out;
}

async function getProvidersForCandidates(
  candidates: Candidate[],
  region: string,
): Promise<Map<string, { providerId: number; name: string; logoPath: string | null }[]>> {
  if (candidates.length === 0) return new Map();
  const ids = candidates.map((candidate) => candidate.summary.id);
  const rows = await db
    .select({
      tmdbId: mediaProviders.tmdbId,
      mediaType: mediaProviders.mediaType,
      providerId: mediaProviders.providerId,
      offerType: mediaProviders.offerType,
      displayPriority: providersTable.displayPriority,
      name: providersTable.name,
      logoPath: providersTable.logoPath,
    })
    .from(mediaProviders)
    .innerJoin(providersTable, eq(providersTable.providerId, mediaProviders.providerId))
    .where(
      and(
        inArray(mediaProviders.tmdbId, ids),
        eq(mediaProviders.region, region),
        eq(mediaProviders.offerType, "flatrate"),
      ),
    );

  const grouped = new Map<
    string,
    { providerId: number; name: string; logoPath: string | null; displayPriority: number | null }[]
  >();

  for (const row of rows) {
    const key = `${row.mediaType}:${row.tmdbId}`;
    const entry = {
      providerId: row.providerId,
      name: row.name,
      logoPath: row.logoPath ?? null,
      displayPriority: row.displayPriority,
    };
    const list = grouped.get(key);
    if (list) list.push(entry);
    else grouped.set(key, [entry]);
  }

  const byKey = new Map<string, { providerId: number; name: string; logoPath: string | null }[]>();
  for (const [key, list] of grouped) {
    byKey.set(
      key,
      list
        .sort(byDisplayPriority)
        .map(({ providerId, name, logoPath }) => ({ providerId, name, logoPath })),
    );
  }
  return byKey;
}

function passesShortFilter(candidate: Candidate): boolean {
  if (candidate.summary.media_type === "movie") {
    return candidate.runtime !== null && candidate.runtime <= SHORT_MOVIE_RUNTIME_MAX;
  }
  // For TV, treat short as a typical sitcom-length episode (best effort:
  // movies.runtime stores the first episode runtime when known, otherwise null).
  return candidate.runtime !== null && candidate.runtime <= TV_EPISODE_RUNTIME_MAX;
}

export async function getAvailableFeed(
  userId: string,
  region: string,
  filter: MediaFilter = "all",
): Promise<AvailableEntryDto[]> {
  const [userPlatformIds, watchlistCandidates, trendingCandidates] = await Promise.all([
    getUserPlatformIds(userId, region),
    getWatchlistCandidates(userId, filter),
    getTrendingCandidates(filter),
  ]);

  if (userPlatformIds.length === 0) return [];

  const candidates = dedup([...watchlistCandidates, ...trendingCandidates]);
  if (candidates.length === 0) return [];

  // Runtime back-fill and the provider lookup are independent reads.
  const [, providersByKey] = await Promise.all([
    fillRuntimes(candidates),
    getProvidersForCandidates(candidates, region),
  ]);
  warmMissingProviders(candidates, providersByKey);

  const platformIds = new Set(userPlatformIds);
  const entries: AvailableEntryDto[] = [];
  for (const candidate of candidates) {
    const key = `${candidate.summary.media_type}:${candidate.summary.id}`;
    const providers = providersByKey.get(key) ?? [];
    const matching = providers.filter((provider) => platformIds.has(provider.providerId));
    if (matching.length === 0) continue;
    entries.push({
      ...normalizeSummary(candidate.summary, candidate.summary.media_type),
      providers: matching,
      isShort: passesShortFilter(candidate),
    });
  }

  return entries.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
}
