import { invokeTmdb, normalizeSummary } from "./client";
import type { MediaType, RawTmdbItem, TmdbMovieDetail } from "./types";

export async function getMovieDetail(
  tmdbId: number,
  mediaType: MediaType = "movie",
): Promise<TmdbMovieDetail> {
  const data = await invokeTmdb<RawTmdbItem & Record<string, unknown>>({
    action: "movie",
    tmdb_id: tmdbId,
    media_type: mediaType,
  });
  return { ...data, ...normalizeSummary(data, mediaType) };
}
