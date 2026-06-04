import { DEFAULT_LANGUAGE, tmdbFetch } from "../client";

export function getTvSeasonDetail(
  seriesId: number,
  seasonNumber: number,
  language = DEFAULT_LANGUAGE,
): Promise<Record<string, unknown>> {
  return tmdbFetch<Record<string, unknown>>(
    `/tv/${seriesId}/season/${seasonNumber}`,
    { language },
    60 * 60,
  );
}
