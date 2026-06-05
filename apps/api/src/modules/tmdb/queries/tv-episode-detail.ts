import { DEFAULT_LANGUAGE, tmdbFetch } from "../client";
import type { EpisodeDetailDto } from "../model";
import { toEpisodeDetail } from "../resources";

export async function getTvEpisodeDetail(
  seriesId: number,
  seasonNumber: number,
  episodeNumber: number,
  language = DEFAULT_LANGUAGE,
): Promise<EpisodeDetailDto> {
  const raw = await tmdbFetch<Record<string, unknown>>(
    `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`,
    { language, append_to_response: "credits" },
    60 * 60,
  );
  return toEpisodeDetail(raw);
}
