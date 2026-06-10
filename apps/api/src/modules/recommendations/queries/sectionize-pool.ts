import type { RecommendationSource } from "../../events/shared";
import { mediaKey } from "../../similarity/shared";
import { hashSeed, mulberry32 } from "../rerank";
import { noveltyScore, qualityScore, type ScoreComponents } from "../scoring";

// Slice the persisted candidate pool into display sections. Pure and seeded:
// the same (pool, salt) always yields the same feed, and a new salt (every
// pull-to-refresh) resamples every shelf and rotates the "Because you rated X"
// anchors — variation without recomputing the pool.

export type FeedSectionKey =
  | "today"
  | "because_you_rated"
  | "trending"
  | "acclaimed"
  | "available_tonight"
  | "hidden_gems"
  | "discovery";

export type PoolRow = {
  tmdbId: number;
  mediaType: string;
  score: number;
  rank: number;
  components: ScoreComponents | null;
  anchorTmdbId: number | null;
  anchorMediaType: string | null;
  anchorTitle: string | null;
  popularity: number | null;
  voteAverage: number | null;
  voteCount: number | null;
};

export type PoolSection<T extends PoolRow> = {
  key: FeedSectionKey;
  // Which source the client credits for impressions in this shelf.
  source: RecommendationSource;
  anchorTitle: string | null;
  rows: T[];
};

const SECTION_SIZES: Record<FeedSectionKey, number> = {
  today: 12,
  because_you_rated: 20,
  trending: 20,
  acclaimed: 20,
  available_tonight: 20,
  hidden_gems: 15,
  discovery: 12,
};

// A shelf with a couple of posters feels broken — omit it instead.
const MIN_SECTION_SIZE = 4;
// A title can appear in at most this many sections (hero + one shelf).
const MAX_SECTIONS_PER_TITLE = 2;
// Sample inside a window slightly larger than the shelf so each salt varies
// the picks without dredging the bottom of the pool.
const SAMPLE_WINDOW_FACTOR = 1.6;
const TODAY_WINDOW = 40;
const MAX_ANCHOR_ROWS = 3;
const MIN_ANCHOR_GROUP = 5;

const ACCLAIMED_MIN_QUALITY = 0.7;
const ACCLAIMED_MIN_VOTES = 1000;
const HIDDEN_GEM_MIN_QUALITY = 0.6;
const HIDDEN_GEM_VOTES = { min: 100, max: 1500 } as const;
const HIDDEN_GEM_MIN_NOVELTY = 0.5;
const DISCOVERY_NOVELTY_MIN = 0.7;

function rowQuality(row: PoolRow): number {
  return row.components?.quality ?? qualityScore(row.voteAverage, row.voteCount);
}

// Weighted sampling without replacement; score² sharpens toward the head so
// shelves stay high-quality while still rotating between salts.
function sampleByScore<T extends PoolRow>(rows: T[], count: number, random: () => number): T[] {
  const remaining = [...rows];
  const picked: T[] = [];
  while (picked.length < count && remaining.length > 0) {
    const weights = remaining.map((row) => row.score * row.score + 1e-6);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = random() * total;
    let index = 0;
    while (index < remaining.length - 1 && roll >= weights[index]) {
      roll -= weights[index];
      index += 1;
    }
    picked.push(remaining.splice(index, 1)[0]);
  }
  return picked;
}

export function sectionizePool<T extends PoolRow>(rows: T[], seedInput: string): PoolSection<T>[] {
  const random = mulberry32(hashSeed(seedInput));
  const usage = new Map<string, number>();
  const usable = (candidates: T[]): T[] =>
    candidates.filter(
      (row) => (usage.get(mediaKey(row.tmdbId, row.mediaType)) ?? 0) < MAX_SECTIONS_PER_TITLE,
    );
  const claim = (picked: T[]): T[] => {
    for (const row of picked) {
      const key = mediaKey(row.tmdbId, row.mediaType);
      usage.set(key, (usage.get(key) ?? 0) + 1);
    }
    return picked;
  };

  const byRank = [...rows].sort((a, b) => a.rank - b.rank);
  const byScore = [...rows].sort((a, b) => b.score - a.score);
  const sections: PoolSection<T>[] = [];
  const push = (
    key: FeedSectionKey,
    source: RecommendationSource,
    picked: T[],
    anchorTitle: string | null = null,
  ) => {
    if (picked.length < MIN_SECTION_SIZE) return;
    sections.push({ key, source, anchorTitle, rows: claim(picked) });
  };
  const sampleShelf = (key: FeedSectionKey, candidates: T[]): T[] => {
    const size = SECTION_SIZES[key];
    const window = usable(candidates).slice(0, Math.ceil(size * SAMPLE_WINDOW_FACTOR));
    return sampleByScore(window, size, random);
  };

  // Hero row: resample the head of the diversity-ranked pool.
  push("today", "content", sampleByScore(usable(byRank).slice(0, TODAY_WINDOW), SECTION_SIZES.today, random));

  // "Because you rated X": rotate which anchors get a row on every salt.
  const anchorGroups = new Map<string, { title: string | null; rows: T[] }>();
  for (const row of byScore) {
    if (row.anchorTmdbId === null || row.anchorMediaType === null) continue;
    const key = mediaKey(row.anchorTmdbId, row.anchorMediaType);
    let group = anchorGroups.get(key);
    if (!group) {
      group = { title: row.anchorTitle, rows: [] };
      anchorGroups.set(key, group);
    }
    group.rows.push(row);
  }
  const eligibleAnchors = [...anchorGroups.values()].filter(
    (group) => group.title !== null && group.rows.length >= MIN_ANCHOR_GROUP,
  );
  for (let i = 0; i < MAX_ANCHOR_ROWS && eligibleAnchors.length > 0; i += 1) {
    const weights = eligibleAnchors.map((group) => group.rows.length);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = random() * total;
    let index = 0;
    while (index < eligibleAnchors.length - 1 && roll >= weights[index]) {
      roll -= weights[index];
      index += 1;
    }
    const [group] = eligibleAnchors.splice(index, 1);
    push("because_you_rated", "content", sampleShelf("because_you_rated", group.rows), group.title);
  }

  push(
    "trending",
    "trending",
    sampleShelf(
      "trending",
      byScore.filter((row) => row.components?.trendingGlobal !== undefined),
    ),
  );
  push(
    "acclaimed",
    "trending",
    sampleShelf(
      "acclaimed",
      byScore.filter(
        (row) =>
          rowQuality(row) >= ACCLAIMED_MIN_QUALITY && (row.voteCount ?? 0) >= ACCLAIMED_MIN_VOTES,
      ),
    ),
  );
  push(
    "available_tonight",
    "availability",
    sampleShelf(
      "available_tonight",
      byScore.filter((row) => row.components?.availability === 1),
    ),
  );
  push(
    "hidden_gems",
    "content",
    sampleShelf(
      "hidden_gems",
      byScore.filter(
        (row) =>
          rowQuality(row) >= HIDDEN_GEM_MIN_QUALITY &&
          (row.voteCount ?? 0) >= HIDDEN_GEM_VOTES.min &&
          (row.voteCount ?? 0) <= HIDDEN_GEM_VOTES.max &&
          noveltyScore(row.popularity) >= HIDDEN_GEM_MIN_NOVELTY,
      ),
    ),
  );
  push(
    "discovery",
    "content",
    sampleShelf(
      "discovery",
      byScore.filter((row) => noveltyScore(row.popularity) >= DISCOVERY_NOVELTY_MIN),
    ),
  );

  return sections;
}
