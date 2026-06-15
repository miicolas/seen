import { asNumber, asString } from "../../../lib/coerce";
import { normalizeSummary } from "../normalize";
import type { RawTmdbItem, TmdbMovieSummary } from "../types";
import type { PersonDetailDto } from "../model";

// One credit can appear several times in combined_credits (multiple crew jobs on
// the same title, recurring TV roles); collapse to one entry per title.
function dedupeByTitle(items: TmdbMovieSummary[]): TmdbMovieSummary[] {
  const seen = new Set<string>();
  const out: TmdbMovieSummary[] = [];
  for (const item of items) {
    const key = `${item.media_type}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

// Most relevant work first: popularity, then most recent.
function byPopularityThenRecency(a: TmdbMovieSummary, b: TmdbMovieSummary): number {
  const popularity = (b.popularity ?? 0) - (a.popularity ?? 0);
  if (popularity !== 0) return popularity;
  return (b.release_date ?? "").localeCompare(a.release_date ?? "");
}

// Normalize a combined-credits list (cast or crew) to the shared media-summary
// shape: movie/tv only, poster-only, de-duplicated, sorted by relevance.
function toFilmography(entries: unknown): TmdbMovieSummary[] {
  if (!Array.isArray(entries)) return [];
  const normalized = entries
    .map((entry) => entry as RawTmdbItem)
    .filter((entry) => entry?.media_type === "movie" || entry?.media_type === "tv")
    .map((entry) => normalizeSummary(entry, "movie"))
    .filter((entry) => !!entry.poster_path);
  return dedupeByTitle(normalized).sort(byPopularityThenRecency);
}

export function toPersonDetail(raw: Record<string, unknown>): PersonDetailDto {
  const credits = raw.combined_credits as Record<string, unknown> | undefined;

  return {
    id: asNumber(raw.id) ?? 0,
    name: asString(raw.name) ?? "",
    biography: asString(raw.biography) ?? null,
    profile_path: (raw.profile_path as string | null | undefined) ?? null,
    known_for_department: asString(raw.known_for_department) ?? null,
    acting: toFilmography(credits?.cast),
    crew: toFilmography(credits?.crew),
  };
}
