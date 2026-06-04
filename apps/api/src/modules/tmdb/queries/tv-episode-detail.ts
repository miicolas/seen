import { DEFAULT_LANGUAGE, tmdbFetch } from "../client";

export function getTvEpisodeDetail(
  seriesId: number,
  seasonNumber: number,
  episodeNumber: number,
  language = DEFAULT_LANGUAGE,
): Promise<Record<string, unknown>> {
  return tmdbFetch<Record<string, unknown>>(
    `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`,
    { language, append_to_response: "credits" },
    60 * 60,
  );
}
