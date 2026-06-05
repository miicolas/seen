import { DEFAULT_LANGUAGE, tmdbFetch } from "../client";
import type { SeasonDetailDto } from "../model";
import { toSeasonDetail } from "../resources";

export async function getTvSeasonDetail(
  seriesId: number,
  seasonNumber: number,
  language = DEFAULT_LANGUAGE,
): Promise<SeasonDetailDto> {
  const raw = await tmdbFetch<Record<string, unknown>>(
    `/tv/${seriesId}/season/${seasonNumber}`,
    { language },
    60 * 60,
  );
  return toSeasonDetail(raw);
}
