import { db } from "@seen/db";
import { mediaFeatures, movies as moviesTable, notInterested, reviews } from "@seen/db/schema";
import { and, eq, inArray } from "@seen/db/orm";

import { getContentCandidates } from "../../similarity/queries/get-content-candidates";
import { mediaKey, type CandidateReason } from "../../similarity/shared";
import { trending } from "../../tmdb/summaries";
import { getMediaDetail } from "../../tmdb/queries/media-detail";
import type { MediaType } from "../../tmdb";
import type { RecommendationSource } from "../../events/shared";
import { hashSeed, rerank } from "../rerank";
import { passesQualityGate } from "../quality-gate";
import {
  clamp01,
  normalizeWeights,
  noveltyScore,
  qualityScore,
  scoreCandidate,
  trendingRankScore,
  type ScoreComponents,
  type ScoredCandidate,
  type SignalKey,
} from "../scoring";
import { getAnchorExpansionCandidates } from "./get-anchor-expansion-candidates";
import { getCollaborativeCandidates } from "./get-collaborative-candidates";
import { getImpressionFatigue } from "./get-impression-fatigue";
import { getProvidersForCandidates, getUserPlatformIds } from "./candidate-providers";
import { getQualityTopUp } from "./get-quality-top-up";
import { computeFriendSignals, getFolloweeIds } from "./friend-signal";

// Cap on how many vector-less titles we warm per compute; they join the pool on
// the next recompute once their detail (and feature row) lands.
const MAX_WARM_PER_COMPUTE = 24;
const CONTENT_CANDIDATE_LIMIT = 120;
// The persisted pool the serving layer slices into sections per request.
const POOL_LIMIT = 200;
// Below this many merged candidates, fill from the TMDB quality catalog so a
// sparse account (few ratings, no neighbors, no follows) still gets a full feed.
const TOP_UP_THRESHOLD = 160;
const FRIEND_SIGNAL_SATURATION = 3;
// Multiplicative penalty for titles shown repeatedly without engagement.
const FATIGUE_PENALTY = 0.45;

export type FeedEntryDraft = {
  tmdbId: number;
  mediaType: MediaType;
  source: RecommendationSource;
  score: number;
  rank: number;
  components: ScoreComponents;
  anchorTmdbId: number | null;
  anchorMediaType: MediaType | null;
  anchorTitle: string | null;
  primaryGenreId: number | null;
  directorKey: string | null;
  popularity: number | null;
  voteAverage: number | null;
  voteCount: number | null;
};

export type ComputedFeed = {
  entries: FeedEntryDraft[];
  coldStart: boolean;
};

type Accumulator = {
  tmdbId: number;
  mediaType: MediaType;
  components: ScoreComponents;
  source: RecommendationSource;
  reason: CandidateReason | null;
};

// Gather candidates from every source, merge per title, score with the weighted
// mix (renormalized over the signals this user actually has), apply impression
// fatigue, and re-rank for diversity into one large pool. Sectionizing happens
// at serving time (sectionize-pool) so each refresh can resample; persistence
// is the caller's concern (store-feed / serving).
export async function computeUserFeed(userId: string, region: string): Promise<ComputedFeed> {
  const daySeed = hashSeed(`${userId}:${region}:${new Date().toISOString().slice(0, 10)}`);
  const [
    contentCandidates,
    collaborativeCandidates,
    expansionCandidates,
    trendingList,
    userPlatformIds,
    followeeIds,
    fatigueByKey,
  ] = await Promise.all([
    getContentCandidates(userId, { limit: CONTENT_CANDIDATE_LIMIT }),
    getCollaborativeCandidates(userId),
    getAnchorExpansionCandidates(userId),
    trending("all", "week"),
    getUserPlatformIds(userId, region),
    getFolloweeIds(userId),
    getImpressionFatigue(userId),
  ]);

  const pool = new Map<string, Accumulator>();
  const accumulate = (
    tmdbId: number,
    mediaType: MediaType,
    source: RecommendationSource,
    components: ScoreComponents,
    reason: CandidateReason | null = null,
  ) => {
    const key = mediaKey(tmdbId, mediaType);
    let entry = pool.get(key);
    if (!entry) {
      entry = { tmdbId, mediaType, components: {}, source, reason };
      pool.set(key, entry);
    }
    Object.assign(entry.components, components);
    if (!entry.reason && reason) entry.reason = reason;
  };

  // Expansion first: its anchor reasons win the per-title slot, which keeps
  // "Because you rated X" rows well-stocked.
  for (const candidate of expansionCandidates) {
    accumulate(
      candidate.tmdbId,
      candidate.mediaType,
      "content",
      { content: clamp01(candidate.score * 0.5) },
      candidate.reason,
    );
  }
  for (const candidate of contentCandidates) {
    accumulate(
      candidate.tmdbId,
      candidate.mediaType,
      "content",
      { content: clamp01(candidate.score) },
      candidate.reason,
    );
  }
  for (const candidate of collaborativeCandidates) {
    accumulate(candidate.tmdbId, candidate.mediaType, "collaborative", {
      collaborative: candidate.score,
    });
  }
  trendingList.forEach((summary, index) => {
    accumulate(summary.id, summary.media_type, "trending", {
      trendingGlobal: trendingRankScore(index, trendingList.length),
    });
  });
  if (pool.size < TOP_UP_THRESHOLD) {
    // Sparse account: backfill with widely-seen, well-rated catalog titles so
    // the pool (and every section sliced from it) stays full.
    const topUp = await getQualityTopUp(daySeed);
    for (const summary of topUp) {
      accumulate(summary.id, summary.media_type, "trending", {});
    }
  }

  const refs = [...pool.values()];
  if (refs.length === 0) return { entries: [], coldStart: true };

  // Trending/availability candidates haven't been through the per-user
  // exclusions that content/collaborative queries already apply.
  const tmdbIds = [...new Set(refs.map((ref) => ref.tmdbId))];
  const [reviewedRows, dismissedRows, providersByKey, friendSignals, movieRows, featureRows] =
    await Promise.all([
      db
        .select({ tmdbId: reviews.tmdbId, mediaType: reviews.mediaType })
        .from(reviews)
        .where(and(eq(reviews.userId, userId), inArray(reviews.tmdbId, tmdbIds))),
      db
        .select({ tmdbId: notInterested.tmdbId, mediaType: notInterested.mediaType })
        .from(notInterested)
        .where(and(eq(notInterested.userId, userId), inArray(notInterested.tmdbId, tmdbIds))),
      getProvidersForCandidates(refs, region),
      computeFriendSignals(
        followeeIds,
        refs.map((ref) => ({ id: ref.tmdbId, media_type: ref.mediaType })),
      ),
      db
        .select({
          tmdbId: moviesTable.tmdbId,
          mediaType: moviesTable.mediaType,
          genres: moviesTable.genres,
          popularity: moviesTable.popularity,
          voteAverage: moviesTable.voteAverage,
          voteCount: moviesTable.voteCount,
          releaseDate: moviesTable.releaseDate,
        })
        .from(moviesTable)
        .where(inArray(moviesTable.tmdbId, tmdbIds)),
      db
        .select({
          tmdbId: mediaFeatures.tmdbId,
          mediaType: mediaFeatures.mediaType,
          features: mediaFeatures.features,
        })
        .from(mediaFeatures)
        .where(inArray(mediaFeatures.tmdbId, tmdbIds)),
    ]);

  const excluded = new Set([
    ...reviewedRows.map((row) => mediaKey(row.tmdbId, row.mediaType)),
    ...dismissedRows.map((row) => mediaKey(row.tmdbId, row.mediaType)),
  ]);
  const moviesByKey = new Map(movieRows.map((row) => [mediaKey(row.tmdbId, row.mediaType), row]));
  const directorByKey = new Map<string, string>();
  for (const row of featureRows) {
    const tokens = Array.isArray(row.features) ? (row.features as { token?: string }[]) : [];
    const director = tokens.find(
      (entry) => entry.token?.startsWith("director:") || entry.token?.startsWith("creator:"),
    );
    if (director?.token) directorByKey.set(mediaKey(row.tmdbId, row.mediaType), director.token);
  }

  // Renormalize weights over the signals this user can produce, so a sparse
  // account isn't penalized for having no neighbors or followed profiles.
  const activeSignals: SignalKey[] = ["quality", "availability", "novelty", "trendingGlobal"];
  if (contentCandidates.length > 0 || expansionCandidates.length > 0) activeSignals.push("content");
  if (collaborativeCandidates.length > 0) activeSignals.push("collaborative");
  if (followeeIds.length > 0) activeSignals.push("trendingBubble");
  const weights = normalizeWeights(activeSignals);

  const platformIds = new Set(userPlatformIds);
  const scored: ScoredCandidate[] = [];
  let warmed = 0;
  for (const ref of refs) {
    const key = mediaKey(ref.tmdbId, ref.mediaType);
    if (excluded.has(key)) continue;

    const movie = moviesByKey.get(key);
    if (!movie) {
      // Unknown title: warm its detail so the next compute can rank it.
      if (warmed < MAX_WARM_PER_COMPUTE) {
        warmed += 1;
        void getMediaDetail(ref.mediaType, ref.tmdbId).catch(() => {});
      }
      continue;
    }
    // Never recommend unreleased, unrated, or barely-rated titles.
    if (!passesQualityGate(movie)) continue;

    const available = (providersByKey.get(key) ?? []).some((provider) =>
      platformIds.has(provider.providerId),
    );
    const friendSignal = friendSignals.get(`${ref.mediaType}:${ref.tmdbId}`);
    const components: ScoreComponents = {
      ...ref.components,
      availability: available ? 1 : 0,
      novelty: noveltyScore(movie.popularity),
      quality: qualityScore(movie.voteAverage, movie.voteCount),
    };
    if (friendSignal) {
      components.trendingBubble = clamp01(friendSignal.count / FRIEND_SIGNAL_SATURATION);
    }
    const fatigue = fatigueByKey.get(key) ?? 0;
    if (fatigue > 0) components.fatigue = fatigue;

    const genres = Array.isArray(movie.genres) ? (movie.genres as number[]) : [];
    scored.push({
      tmdbId: ref.tmdbId,
      mediaType: ref.mediaType,
      finalScore: scoreCandidate(components, weights) * (1 - FATIGUE_PENALTY * fatigue),
      components,
      source: ref.source,
      reason: ref.reason,
      primaryGenreId: genres[0] ?? null,
      directorKey: directorByKey.get(key) ?? null,
      popularity: movie.popularity,
      voteAverage: movie.voteAverage,
      voteCount: movie.voteCount,
    });
  }

  const ranked = rerank(scored, { seed: daySeed, limit: POOL_LIMIT });
  const coldStart = contentCandidates.length === 0 && collaborativeCandidates.length === 0;
  return {
    entries: ranked.map((candidate, index) => ({
      tmdbId: candidate.tmdbId,
      mediaType: candidate.mediaType,
      source: candidate.source,
      score: candidate.finalScore,
      rank: index,
      components: candidate.components,
      anchorTmdbId: candidate.reason?.anchorTmdbId ?? null,
      anchorMediaType: candidate.reason?.anchorMediaType ?? null,
      anchorTitle: candidate.reason?.anchorTitle ?? null,
      primaryGenreId: candidate.primaryGenreId,
      directorKey: candidate.directorKey,
      popularity: candidate.popularity,
      voteAverage: candidate.voteAverage,
      voteCount: candidate.voteCount,
    })),
    coldStart,
  };
}
