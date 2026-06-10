import { noveltyScore, type ScoredCandidate } from "./scoring";

// Re-ranking constraints (epic #6): keep the feed varied and watchable rather
// than letting the raw score dominate. Greedy pick over the scored pool with a
// seeded PRNG so a given (user, feed batch) is deterministic.
const MAX_CONSECUTIVE_GENRE = 2;
const MAX_CONSECUTIVE_DIRECTOR = 2;
const MAX_CONSECUTIVE_MEDIA_TYPE = 2;
// ~70% exploitation / 20% adjacent exploration / 10% surprise.
const EXPLORE_ADJACENT_RATE = 0.2;
const EXPLORE_SURPRISE_RATE = 0.1;
const ADJACENT_RANK_START = 4;
const ADJACENT_RANK_END = 25;
const DISCOVERY_NOVELTY_MIN = 0.7;
// If the first picks contain no discovery yet, force one here so it lands in
// the top 10 whenever the pool has any.
const DISCOVERY_FORCED_POSITION = 7;

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

type RerankOptions = {
  seed: number;
  limit: number;
};

function violatesRun<T>(picked: ScoredCandidate[], max: number, key: (c: ScoredCandidate) => T) {
  return (candidate: ScoredCandidate): boolean => {
    const value = key(candidate);
    if (value === null) return false;
    let run = 0;
    for (let i = picked.length - 1; i >= 0 && key(picked[i]) === value; i -= 1) run += 1;
    return run >= max;
  };
}

function isDiscovery(candidate: ScoredCandidate): boolean {
  return noveltyScore(candidate.popularity) >= DISCOVERY_NOVELTY_MIN;
}

export function rerank(candidates: ScoredCandidate[], options: RerankOptions): ScoredCandidate[] {
  const random = mulberry32(options.seed);
  const pool = [...candidates].sort((a, b) => b.finalScore - a.finalScore);
  const picked: ScoredCandidate[] = [];

  while (picked.length < options.limit && pool.length > 0) {
    const genreBlocked = violatesRun(picked, MAX_CONSECUTIVE_GENRE, (c) => c.primaryGenreId);
    const directorBlocked = violatesRun(picked, MAX_CONSECUTIVE_DIRECTOR, (c) => c.directorKey);
    const mediaBlocked = violatesRun(picked, MAX_CONSECUTIVE_MEDIA_TYPE, (c) => c.mediaType);
    let eligible = pool.filter(
      (candidate) =>
        !genreBlocked(candidate) && !directorBlocked(candidate) && !mediaBlocked(candidate),
    );
    // Constraints unsatisfiable (e.g. every candidate shares one genre):
    // degrade gracefully instead of truncating the feed.
    if (eligible.length === 0) eligible = pool;

    // Force a minimum of discovery into the head of the feed.
    const mustForceDiscovery =
      picked.length === DISCOVERY_FORCED_POSITION &&
      !picked.some(isDiscovery) &&
      eligible.some(isDiscovery);

    let choice: ScoredCandidate;
    const roll = random();
    if (mustForceDiscovery) {
      choice = eligible.filter(isDiscovery).sort((a, b) => b.finalScore - a.finalScore)[0];
    } else if (roll < EXPLORE_SURPRISE_RATE) {
      // Surprise: sample from the most-novel quartile of what's eligible.
      const byNovelty = [...eligible].sort(
        (a, b) => noveltyScore(b.popularity) - noveltyScore(a.popularity),
      );
      const quartile = byNovelty.slice(0, Math.max(1, Math.ceil(byNovelty.length / 4)));
      choice = quartile[Math.floor(random() * quartile.length)];
    } else if (roll < EXPLORE_SURPRISE_RATE + EXPLORE_ADJACENT_RATE) {
      // Adjacent exploration: sample below the head instead of always taking it.
      const start = Math.min(ADJACENT_RANK_START, eligible.length - 1);
      const end = Math.min(ADJACENT_RANK_END, eligible.length);
      const window = eligible.slice(start, end);
      choice = window.length ? window[Math.floor(random() * window.length)] : eligible[0];
    } else {
      choice = eligible[0];
    }

    picked.push(choice);
    pool.splice(pool.indexOf(choice), 1);
  }

  return picked;
}
