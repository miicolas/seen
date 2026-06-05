import type { TmdbTvSeasonSummary } from "@/lib/tmdb";

export function normalizeSeasons(seasons: TmdbTvSeasonSummary[]): TmdbTvSeasonSummary[] {
  return seasons
    .filter((season) => Number.isInteger(season.season_number))
    .sort((a, b) => a.season_number - b.season_number);
}
