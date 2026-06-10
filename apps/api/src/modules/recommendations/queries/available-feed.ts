import { db } from "@seen/db";
import { movies as moviesTable, watchlist } from "@seen/db/schema";
import { and, eq, inArray } from "@seen/db/orm";

import { normalizeSummary } from "../../tmdb/normalize";
import { trending } from "../../tmdb/summaries";
import { getMediaDetail } from "../../tmdb/queries/media-detail";
import type { MediaFilter, TmdbMovieSummary } from "../../tmdb";
import type { AvailableEntryDto } from "../model";
import { getProvidersForCandidates, getUserPlatformIds } from "./candidate-providers";
import { computeFriendSignals, getFolloweeIds } from "./friend-signal";
import { movieRowToSummary } from "./movie-row";

// Cap on how many cache-cold titles we warm per request, so a fresh feed
// populates itself over a few loads without fanning out to TMDB unbounded.
const MAX_WARM_PER_REQUEST = 16;

const SHORT_MOVIE_RUNTIME_MAX = 100;
const TV_EPISODE_RUNTIME_MAX = 45;

type Candidate = {
  summary: TmdbMovieSummary;
  runtime: number | null;
};

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
    summary: movieRowToSummary(media),
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
    getProvidersForCandidates(
      candidates.map((candidate) => ({
        tmdbId: candidate.summary.id,
        mediaType: candidate.summary.media_type,
      })),
      region,
    ),
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
      friendSignalCount: 0,
      friendReason: null,
    });
  }

  // Annotate each surviving entry with how many followed profiles engaged with it,
  // then float social matches above equal non-social ones.
  const followeeIds = await getFolloweeIds(userId);
  const signals = await computeFriendSignals(
    followeeIds,
    entries.map((entry) => ({ id: entry.id, media_type: entry.media_type })),
  );
  for (const entry of entries) {
    const signal = signals.get(`${entry.media_type}:${entry.id}`);
    if (signal) {
      entry.friendSignalCount = signal.count;
      entry.friendReason = signal.reason;
    }
  }

  return entries.sort(
    (a, b) =>
      b.friendSignalCount - a.friendSignalCount || (b.popularity ?? 0) - (a.popularity ?? 0),
  );
}
