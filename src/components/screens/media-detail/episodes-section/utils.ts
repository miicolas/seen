import type { TmdbTvSeasonSummary } from "@/lib/tmdb";

export function normalizeSeasons(
  seasons: TmdbTvSeasonSummary[],
): TmdbTvSeasonSummary[] {
  return seasons
    .filter((season) => Number.isInteger(season.season_number))
    .sort((a, b) => a.season_number - b.season_number);
}

export function formatEpisodeDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
