import type { MovieDetailDto } from "../tmdb/model";
import type { WeightedToken } from "./encoder";

// Per-namespace token weights. Genres and keywords are the strongest content
// signal; cast/decade/runtime/popularity add texture. Tuning these (or the bands
// below) changes the vector space and must bump ENCODER_VERSION.
const WEIGHTS = {
  genre: 1.0,
  keyword: 0.8,
  cast: 0.5,
  director: 0.9,
  creator: 0.9,
  decade: 0.4,
  runtime: 0.3,
  popularity: 0.2,
} as const;

const MAX_KEYWORDS = 10;
const MAX_CAST = 8;

function runtimeBand(runtime: number): string {
  if (runtime < 90) return "short";
  if (runtime <= 130) return "medium";
  return "long";
}

function popularityBand(popularity: number): string {
  if (popularity < 10) return "low";
  if (popularity <= 50) return "mid";
  return "high";
}

function decadeOf(releaseDate: string | undefined): number | null {
  if (!releaseDate) return null;
  const year = Number(releaseDate.slice(0, 4));
  if (!Number.isInteger(year) || year < 1870) return null;
  return Math.floor(year / 10) * 10;
}

function slug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

// Derive the weighted content tokens for one media title from its cached detail
// DTO. Tolerant of missing fields (e.g. detail cached before keywords were
// appended) — absent signals simply contribute no tokens.
export function extractMediaTokens(detail: MovieDetailDto): WeightedToken[] {
  const tokens: WeightedToken[] = [];

  for (const genre of detail.genres ?? []) {
    tokens.push({ token: `genre:${genre.id}`, weight: WEIGHTS.genre });
  }

  for (const keyword of (detail.keywords ?? []).slice(0, MAX_KEYWORDS)) {
    tokens.push({ token: `keyword:${keyword.id}`, weight: WEIGHTS.keyword });
  }

  for (const member of (detail.credits?.cast ?? []).slice(0, MAX_CAST)) {
    tokens.push({ token: `cast:${member.id}`, weight: WEIGHTS.cast });
  }

  for (const member of detail.credits?.crew ?? []) {
    if (member.job === "Director") {
      tokens.push({ token: `director:${member.id}`, weight: WEIGHTS.director });
    }
  }

  for (const creator of detail.created_by ?? []) {
    if (creator.name)
      tokens.push({ token: `creator:${slug(creator.name)}`, weight: WEIGHTS.creator });
  }

  const decade = decadeOf(detail.release_date);
  if (decade != null) tokens.push({ token: `decade:${decade}`, weight: WEIGHTS.decade });

  const runtime = detail.runtime ?? detail.episode_run_time?.[0] ?? null;
  if (runtime != null && runtime > 0) {
    tokens.push({ token: `runtime:${runtimeBand(runtime)}`, weight: WEIGHTS.runtime });
  }

  if (detail.popularity != null) {
    tokens.push({
      token: `popularity:${popularityBand(detail.popularity)}`,
      weight: WEIGHTS.popularity,
    });
  }

  return tokens;
}
