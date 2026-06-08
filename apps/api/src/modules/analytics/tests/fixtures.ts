import type { RuntimeConfidence, WatchEntry } from "../shared";

type EntryOverrides = Partial<WatchEntry>;

// Minimal WatchEntry factory for helper tests — sensible defaults, override per case.
export function entry(overrides: EntryOverrides = {}): WatchEntry {
  const kind = overrides.kind ?? "media";
  const mediaType = overrides.mediaType ?? "movie";
  const countsTowardTime = overrides.countsTowardTime ?? !(kind === "media" && mediaType === "tv");
  const runtimeConfidence: RuntimeConfidence = overrides.runtimeConfidence ?? "exact";
  return {
    watchedAt: overrides.watchedAt ?? new Date("2026-06-08T12:00:00Z"),
    mediaType,
    kind,
    rating: overrides.rating ?? null,
    runtimeMinutes: overrides.runtimeMinutes ?? null,
    runtimeConfidence,
    countsTowardTime,
    tmdbId: overrides.tmdbId ?? 1,
    genreIds: overrides.genreIds ?? [],
    releaseYear: overrides.releaseYear ?? null,
  };
}
