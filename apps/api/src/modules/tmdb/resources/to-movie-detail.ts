import { asNumber, asNumberArray, asString } from "../../../lib/coerce";
import { normalizeSummary } from "../normalize";
import type { MediaType, RawTmdbItem } from "../types";
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

// TMDB nests keywords differently per media type: movies under `keywords.keywords`,
// TV under `keywords.results`. Normalize both to a flat {id, name}[] for the cached
// detail so the similarity encoder has a stable shape to read. Must also accept an
// already-flat array: cache hits re-run toMovieDetail over the stored DTO.
function keywordList(value: unknown): { id: number; name: string }[] | undefined {
  const container = value as Record<string, unknown> | undefined;
  const raw = Array.isArray(value) ? value : (container?.keywords ?? container?.results);
  if (!Array.isArray(raw)) return undefined;
  const keywords = raw
    .map((entry) => {
      const record = entry as Record<string, unknown> | null;
      const id = asNumber(record?.id);
      const name = asString(record?.name);
      return id != null && name != null ? { id, name } : null;
    })
    .filter((entry): entry is { id: number; name: string } => entry != null);
  return keywords.length > 0 ? keywords : undefined;
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
    keywords: keywordList(raw.keywords),
    tagline: asString(raw.tagline) ?? null,
    status: asString(raw.status),
    original_language: asString(raw.original_language),
    credits: credits ? { cast: toCredits(credits.cast), crew: toCredits(credits.crew) } : undefined,
    created_by: namedList(raw.created_by),
    production_companies: namedList(raw.production_companies),
    _cache: cache,
  };
}
