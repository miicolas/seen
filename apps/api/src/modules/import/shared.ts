import type { MediaType, TmdbMovieSummary } from "../tmdb";

// Letterboxd is films-only, so every imported title is a movie.
export const IMPORT_MEDIA_TYPE: MediaType = "movie";

// Hard ceiling for a single synchronous import. A typical Letterboxd export is
// a few hundred to low-thousands of rows; beyond this we ask the user to split
// the file rather than risk an HTTP timeout (see the PRD's synchronous-model note).
export const MAX_IMPORT_ROWS = 4000;

export type ImportTarget = "review" | "watchlist";

// One Letterboxd entry, normalized across CSV files and the RSS feed. `rating`
// is already on Seen's stored 1..10 scale; `tmdbId` is only present for RSS rows
// (the CSV export carries no external ids). `watchedAt` is the ISO date the entry
// happened — the watch date for reviews, the add date for watchlist rows — so the
// import preserves history instead of stamping everything with the import day.
export type NormalizedRow = {
  target: ImportTarget;
  title: string;
  year?: number;
  uri?: string;
  rating?: number | null;
  comment?: string | null;
  watchedAt?: string;
  tmdbId?: number;
};

export type TmdbCandidate = {
  tmdb_id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
};

export type UnmatchedRow = {
  target: ImportTarget;
  title: string;
  year?: number;
  uri?: string;
  rating?: number | null;
  comment?: string | null;
  watched_at?: string;
  candidates: TmdbCandidate[];
};

export type ImportSummary = {
  imported: number;
  skipped: number;
  unmatched: UnmatchedRow[];
};

// Letterboxd ratings are 0.5..5 in half-star steps; Seen stores 1..10. A missing
// or zero rating means "no rating" (review carries only its comment).
export function letterboxdRatingToStored(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value) || value <= 0) return null;
  return Math.min(10, Math.max(1, Math.round(value * 2)));
}

export function parseYear(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const year = Number.parseInt(value.trim().slice(0, 4), 10);
  return Number.isFinite(year) ? year : undefined;
}

// Letterboxd date cells are "YYYY-MM-DD" (a calendar day, no time). Anchor them to
// UTC midnight so the stored watched_at lands on the day the user logged, and drop
// anything unparseable or in the future rather than guessing.
export function parseLetterboxdDate(value: string | undefined): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value?.trim() ?? "");
  if (!match) return undefined;
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(ms) || ms > Date.now()) return undefined;
  return new Date(ms).toISOString();
}

export function releaseYear(summary: TmdbMovieSummary): number | undefined {
  return parseYear(summary.release_date);
}

// Collapse diacritics, punctuation and spacing so "WALL·E" and "Wall E" compare
// equal when disambiguating title matches.
export function normalizeTitle(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function toCandidate(summary: TmdbMovieSummary): TmdbCandidate {
  return {
    tmdb_id: summary.id,
    title: summary.title ?? "",
    release_date: summary.release_date,
    poster_path: summary.poster_path ?? null,
  };
}
