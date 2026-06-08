import { db } from "@seen/db";
import { movies } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { getMediaDetail, getTvEpisodeDetail } from "../../tmdb";
import type { RuntimeConfidence } from "../shared";

export type EpisodeRuntimeSnapshot = {
  runtimeMinutes: number | null;
  runtimeConfidence: RuntimeConfidence;
};

const UNKNOWN: EpisodeRuntimeSnapshot = { runtimeMinutes: null, runtimeConfidence: "unknown" };

// Snapshot how long this episode took to watch, recorded at review time so later
// analytics never re-derive it (TMDB can change, episodes get re-cut). Best source
// wins: the TMDB episode's own runtime is `exact`; the series' average runtime is an
// `estimated` stand-in; with neither we store `unknown` and the minutes go uncounted.
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
    // TMDB miss falls through to the series-level estimate.
  }

  // Warm the series row so `movies.runtime` (TMDB's average episode runtime) is
  // populated for the estimate, then read it back.
  await getMediaDetail("tv", seriesTmdbId).catch(() => null);

  const [series] = await db
    .select({ runtime: movies.runtime })
    .from(movies)
    .where(and(eq(movies.tmdbId, seriesTmdbId), eq(movies.mediaType, "tv")))
    .limit(1);

  if (series?.runtime && series.runtime > 0) {
    return { runtimeMinutes: series.runtime, runtimeConfidence: "estimated" };
  }

  return UNKNOWN;
}
