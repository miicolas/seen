import { getMediaDetail, getTvEpisodeDetail } from "../../tmdb";
import type { RuntimeConfidence } from "../shared";

export type EpisodeRuntimeSnapshot = {
  runtimeMinutes: number | null;
  runtimeConfidence: RuntimeConfidence;
};

const UNKNOWN: EpisodeRuntimeSnapshot = { runtimeMinutes: null, runtimeConfidence: "unknown" };

export async function resolveEpisodeRuntime(
  seriesTmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<EpisodeRuntimeSnapshot> {
  try {
    const episode = await getTvEpisodeDetail(seriesTmdbId, seasonNumber, episodeNumber);
    if (episode.runtime && episode.runtime > 0) {
      return { runtimeMinutes: episode.runtime, runtimeConfidence: "exact" };
    }
  } catch {
    // falls through to series-level estimate
  }

  const series = await getMediaDetail("tv", seriesTmdbId).catch(() => null);
  if (series?.runtime && series.runtime > 0) {
    return { runtimeMinutes: series.runtime, runtimeConfidence: "estimated" };
  }

  return UNKNOWN;
}
