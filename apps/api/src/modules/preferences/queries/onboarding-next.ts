import { mediaKey } from "../../similarity/shared";
import { getMediaDetail } from "../../tmdb";
import { getMediaRecommendations } from "../../tmdb/queries/media-recommendations";
import type { TmdbMovieSummary } from "../../tmdb/types";
import type { OnboardingNextRequestDto, SeedItemDto, SwipeItemDto } from "../model";
import { SEED_TITLES } from "../seed";
import { getSeenKeys } from "./get-seen-keys";
import { toSeedItem } from "./to-seed-item";

// Tree-like adaptive selection: the most recent likes anchor TMDB's per-title
// recommendation lists (exploit), blended with the remaining diverse curated
// probes (explore). Dislikes push their cluster out of contention.
const MAX_ANCHORS = 3;
const ANCHOR_WEIGHTS = [1.0, 0.7, 0.5];
const PER_ANCHOR_CAP = 2;
const MIN_VOTE_COUNT = 50;
const DISLIKE_GENRE_PENALTY = 0.25;
const DISLIKE_REC_PENALTY = 0.5;
const MAX_DISLIKE_PROBES = 2;

type ScoredCandidate = {
  item: TmdbMovieSummary;
  score: number;
  primaryAnchor: number;
};

function passesGate(item: TmdbMovieSummary, today: string): boolean {
  if ((item.vote_count ?? 0) < MIN_VOTE_COUNT) return false;
  if (!item.poster_path) return false;
  if (!item.release_date || item.release_date > today) return false;
  return true;
}

function recListsFor(swipes: SwipeItemDto[]): Promise<TmdbMovieSummary[][]> {
  return Promise.all(
    swipes.map((swipe) =>
      getMediaRecommendations(swipe.media_type, swipe.tmdb_id).catch(
        () => [] as TmdbMovieSummary[],
      ),
    ),
  );
}

async function dislikedGenreIds(dislikes: SwipeItemDto[]): Promise<Set<number>> {
  const details = await Promise.all(
    dislikes.map((swipe) => getMediaDetail(swipe.media_type, swipe.tmdb_id).catch(() => null)),
  );
  const genres = new Set<number>();
  for (const detail of details) {
    const ids = detail?.genre_ids ?? detail?.genres?.map((genre) => genre.id) ?? [];
    for (const id of ids) genres.add(id);
  }
  return genres;
}

function scoreExploit(
  anchorLists: TmdbMovieSummary[][],
  excludeKeys: Set<string>,
  dislikedGenres: Set<number>,
  dislikeRecKeys: Set<string>,
  today: string,
): ScoredCandidate[] {
  const byKey = new Map<string, ScoredCandidate>();
  anchorLists.forEach((list, anchorIdx) => {
    list.forEach((item, rank) => {
      const key = mediaKey(item.id, item.media_type);
      if (excludeKeys.has(key) || !passesGate(item, today)) return;
      const base = (ANCHOR_WEIGHTS[anchorIdx] ?? 0) * (1 - rank / list.length);
      const existing = byKey.get(key);
      if (existing) {
        existing.score += base;
      } else {
        byKey.set(key, { item, score: base, primaryAnchor: anchorIdx });
      }
    });
  });

  for (const [key, candidate] of byKey) {
    const shared = (candidate.item.genre_ids ?? []).filter((id) => dislikedGenres.has(id)).length;
    candidate.score -= DISLIKE_GENRE_PENALTY * shared;
    if (dislikeRecKeys.has(key)) candidate.score -= DISLIKE_REC_PENALTY;
  }

  const perAnchor = new Map<number, number>();
  const picked: ScoredCandidate[] = [];
  for (const candidate of [...byKey.values()].sort((a, b) => b.score - a.score)) {
    if (candidate.score <= 0) break;
    const used = perAnchor.get(candidate.primaryAnchor) ?? 0;
    if (used >= PER_ANCHOR_CAP) continue;
    perAnchor.set(candidate.primaryAnchor, used + 1);
    picked.push(candidate);
  }
  return picked;
}

async function resolveProbes(excludeKeys: Set<string>, needed: number): Promise<SeedItemDto[]> {
  const remaining = SEED_TITLES.filter(
    (entry) => !excludeKeys.has(mediaKey(entry.tmdbId, entry.mediaType)),
  ).slice(0, needed);
  const items = await Promise.all(
    remaining.map(async (entry) => {
      try {
        return toSeedItem(await getMediaDetail(entry.mediaType, entry.tmdbId));
      } catch {
        return null;
      }
    }),
  );
  return items.filter((item): item is SeedItemDto => item !== null);
}

// Returns the next `count` cards given the swipe history so far. Stateless:
// the client sends its decisions plus everything already shown or queued.
export async function getOnboardingNext(
  userId: string,
  input: OnboardingNextRequestDto,
): Promise<SeedItemDto[]> {
  const today = new Date().toISOString().slice(0, 10);
  const excludeKeys = new Set<string>([
    ...input.exclude.map((item) => mediaKey(item.tmdb_id, item.media_type)),
    ...input.swipes.map((item) => mediaKey(item.tmdb_id, item.media_type)),
  ]);

  const likes = input.swipes.filter((swipe) => swipe.choice === "like");
  const dislikes = input.swipes.filter((swipe) => swipe.choice === "dislike");
  const anchors = likes.slice(-MAX_ANCHORS).reverse();
  const dislikeProbes = dislikes.slice(-MAX_DISLIKE_PROBES);

  const [anchorLists, dislikedGenres, dislikeRecLists] = await Promise.all([
    recListsFor(anchors),
    dislikedGenreIds(dislikes),
    recListsFor(dislikeProbes),
  ]);
  const dislikeRecKeys = new Set(
    dislikeRecLists.flat().map((item) => mediaKey(item.id, item.media_type)),
  );

  const exploit = scoreExploit(anchorLists, excludeKeys, dislikedGenres, dislikeRecKeys, today);
  const exploitTarget = likes.length === 0 ? 0 : Math.ceil((input.count * 2) / 3);

  const picks: SeedItemDto[] = [];
  for (const candidate of exploit.slice(0, exploitTarget)) {
    picks.push(toSeedItem(candidate.item));
    excludeKeys.add(mediaKey(candidate.item.id, candidate.item.media_type));
  }

  // Over-fetch slightly so the final already-acted-on filter can't starve the batch.
  const probes = await resolveProbes(excludeKeys, input.count - picks.length + 2);
  for (const probe of probes) {
    picks.push(probe);
    excludeKeys.add(mediaKey(probe.id, probe.media_type));
  }
  for (const candidate of exploit.slice(exploitTarget)) {
    picks.push(toSeedItem(candidate.item));
  }

  const seen = await getSeenKeys(
    userId,
    picks.map((pick) => pick.id),
  );
  return picks.filter((pick) => !seen.has(`${pick.media_type}:${pick.id}`)).slice(0, input.count);
}
