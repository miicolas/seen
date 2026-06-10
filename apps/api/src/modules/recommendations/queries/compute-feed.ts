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
import {
  noveltyScore,
  scoreCandidate,
  trendingRankScore,
  type ScoreComponents,
  type ScoredCandidate,
} from "../scoring";
import { getCollaborativeCandidates } from "./get-collaborative-candidates";
import { getProvidersForCandidates, getUserPlatformIds } from "./candidate-providers";
import { computeFriendSignals, getFolloweeIds } from "./friend-signal";

// Cap on how many vector-less titles we warm per compute; they join the pool on
// the next recompute once their detail (and feature row) lands.
const MAX_WARM_PER_COMPUTE = 16;
const RERANK_LIMIT = 60;
const FRIEND_SIGNAL_SATURATION = 3;
const DISCOVERY_NOVELTY_MIN = 0.7;

const SECTION_SIZES = {
  today: 12,
  because_you_rated: 10,
  trending: 10,
  available_tonight: 10,
  discovery: 6,
} as const;

export type FeedSectionKey = keyof typeof SECTION_SIZES;

export type FeedEntryDraft = {
  section: FeedSectionKey;
  tmdbId: number;
  mediaType: MediaType;
  source: RecommendationSource;
  score: number;
  rank: number;
  anchorTitle: string | null;
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

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

// Gather candidates from every source, merge per title, score with the weighted
// mix, re-rank for diversity, and slice into the five feed sections. Pure
// orchestration — persistence is the caller's concern (store-feed / serving).
export async function computeUserFeed(userId: string, region: string): Promise<ComputedFeed> {
  const [contentCandidates, collaborativeCandidates, trendingList, userPlatformIds, followeeIds] =
    await Promise.all([
      getContentCandidates(userId, { limit: 50 }),
      getCollaborativeCandidates(userId),
      trending("all", "week"),
      getUserPlatformIds(userId, region),
      getFolloweeIds(userId),
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

    const available = (providersByKey.get(key) ?? []).some((provider) =>
      platformIds.has(provider.providerId),
    );
    const friendSignal = friendSignals.get(`${ref.mediaType}:${ref.tmdbId}`);
    const components: ScoreComponents = {
      ...ref.components,
      availability: available ? 1 : 0,
      novelty: noveltyScore(movie.popularity),
    };
    if (friendSignal) {
      components.trendingBubble = clamp01(friendSignal.count / FRIEND_SIGNAL_SATURATION);
    }

    const genres = Array.isArray(movie.genres) ? (movie.genres as number[]) : [];
    scored.push({
      tmdbId: ref.tmdbId,
      mediaType: ref.mediaType,
      finalScore: scoreCandidate(components),
      components,
      source: ref.source,
      reason: ref.reason,
      primaryGenreId: genres[0] ?? null,
      directorKey: directorByKey.get(key) ?? null,
      popularity: movie.popularity,
    });
  }

  const ranked = rerank(scored, { seed: hashSeed(`${userId}:${region}`), limit: RERANK_LIMIT });
  const coldStart = contentCandidates.length === 0 && collaborativeCandidates.length === 0;
  return { entries: sectionize(ranked, scored), coldStart };
}

function toDrafts(
  section: FeedSectionKey,
  candidates: ScoredCandidate[],
  anchorTitle: string | null = null,
): FeedEntryDraft[] {
  return candidates.slice(0, SECTION_SIZES[section]).map((candidate, index) => ({
    section,
    tmdbId: candidate.tmdbId,
    mediaType: candidate.mediaType,
    source: candidate.source,
    score: candidate.finalScore,
    rank: index,
    anchorTitle,
  }));
}

function sectionize(ranked: ScoredCandidate[], scored: ScoredCandidate[]): FeedEntryDraft[] {
  const drafts = [...toDrafts("today", ranked)];

  // "Because you rated X": the anchor backing the most content candidates.
  const byAnchor = new Map<string, { title: string; candidates: ScoredCandidate[] }>();
  for (const candidate of scored) {
    const anchor = candidate.reason;
    if (!anchor?.anchorTitle) continue;
    const key = mediaKey(anchor.anchorTmdbId, anchor.anchorMediaType);
    let group = byAnchor.get(key);
    if (!group) {
      group = { title: anchor.anchorTitle, candidates: [] };
      byAnchor.set(key, group);
    }
    group.candidates.push(candidate);
  }
  const modalAnchor = [...byAnchor.values()].sort(
    (a, b) => b.candidates.length - a.candidates.length,
  )[0];
  if (modalAnchor) {
    drafts.push(
      ...toDrafts(
        "because_you_rated",
        modalAnchor.candidates.sort((a, b) => b.finalScore - a.finalScore),
        modalAnchor.title,
      ),
    );
  }

  drafts.push(
    ...toDrafts(
      "trending",
      ranked.filter((candidate) => candidate.components.trendingGlobal !== undefined),
    ),
    ...toDrafts(
      "available_tonight",
      ranked.filter((candidate) => candidate.components.availability === 1),
    ),
    ...toDrafts(
      "discovery",
      ranked.filter((candidate) => noveltyScore(candidate.popularity) >= DISCOVERY_NOVELTY_MIN),
    ),
  );
  return drafts;
}
