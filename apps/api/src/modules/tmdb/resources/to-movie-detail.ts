import { asNumber, asNumberArray, asString } from "../../../lib/coerce";
import { normalizeSummary, type MediaType, type RawTmdbItem } from "../client";
import type { MovieDetailDto } from "../model";
import { toCredits } from "./to-credit";
import { toGenres } from "./to-genre";
import { toSeasonSummary } from "./to-season-detail";

function namedList(value: unknown): { name?: string }[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((entry) => ({
    name: asString((entry as Record<string, unknown> | null)?.name),
  }));
}

export function toMovieDetail(
  raw: Record<string, unknown>,
  mediaType: MediaType,
  cache: "hit" | "miss",
): MovieDetailDto {
  const summary = normalizeSummary(
    { ...raw, media_type: mediaType } as unknown as RawTmdbItem,
    mediaType,
  );
  const credits = raw.credits as Record<string, unknown> | undefined;

  return {
    ...summary,
    runtime: asNumber(raw.runtime) ?? null,
    episode_run_time: asNumberArray(raw.episode_run_time),
    genres: toGenres(raw.genres),
    number_of_seasons: asNumber(raw.number_of_seasons),
    seasons: Array.isArray(raw.seasons) ? raw.seasons.map(toSeasonSummary) : undefined,
    tagline: asString(raw.tagline) ?? null,
    status: asString(raw.status),
    original_language: asString(raw.original_language),
    credits: credits ? { cast: toCredits(credits.cast), crew: toCredits(credits.crew) } : undefined,
    created_by: namedList(raw.created_by),
    production_companies: namedList(raw.production_companies),
    _cache: cache,
  };
}
